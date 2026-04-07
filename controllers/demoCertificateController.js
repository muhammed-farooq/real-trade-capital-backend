const DemoCertificate = require("../models/demoCertificate");
const { generateCertificate } = require("../utils/certificateGenerator");
const { generatePayoutCertificatePng } = require("../utils/payoutCertificateGenerator");

/**
 * POST /admin/demo-certificate
 * Create a demo certificate (account or payout type)
 */
const createDemoCertificate = async (req, res) => {
  try {

    const {
      type,         // "account" | "payout"
      name,
      issuedOn,
      note,
      // account fields
      accountName,
      phase,
      platform,
      amountSize,
      // payout fields
      payoutAmount,
      paymentMethod,
      payoutPlatform,
    } = req.body;

    if (!type || !name || !issuedOn) {
      return res.status(400).json({ errMsg: "type, name, and issuedOn are required" });
    }

    if (type === "account" && !accountName) {
      return res.status(400).json({ errMsg: "accountName is required for account certificates" });
    }

    if (type === "payout" && !payoutAmount) {
      return res.status(400).json({ errMsg: "payoutAmount is required for payout certificates" });
    }

    // Prevent duplicate accountName for account certs
    if (type === "account") {
      const existing = await DemoCertificate.findOne({ accountName, type: "account" });
      if (existing) {
        return res.status(409).json({ errMsg: "A demo certificate with this accountName already exists" });
      }
    }

    const demoCert = await DemoCertificate.create({
      type,
      name,
      issuedOn: new Date(issuedOn),
      note,
      accountName,
      phase,
      platform,
      amountSize,
      payoutAmount,
      paymentMethod,
      payoutPlatform,
    });

    res.status(201).json({ msg: "Demo certificate created", demoCert });
  } catch (error) {
    console.error("Create demo certificate error:", error);
    res.status(500).json({ errMsg: "Server error", error: error.message });
  }
};

/**
 * GET /admin/demo-certificates
 * List all demo certificates (most recent first)
 */
const listDemoCertificates = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (type) filter.type = type;

    // Capped collections don't support skip/limit well — use _id for pagination
    const certs = await DemoCertificate.find(filter)
      .sort({ _id: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await DemoCertificate.countDocuments(filter);

    res.status(200).json({ certs, total });
  } catch (error) {
    console.error("List demo certificates error:", error);
    res.status(500).json({ errMsg: "Server error" });
  }
};

/**
 * GET /admin/demo-certificate/:id/preview
 * Preview the PNG for a demo certificate
 */
const previewDemoCertificate = async (req, res) => {
  try {
    const cert = await DemoCertificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ errMsg: "Demo certificate not found" });

    let pngBuffer;
    const verifyBase = process.env.FRONTEND_URL;

    if (cert.type === "account") {
      pngBuffer = await generateCertificate({
        name:      cert.name,
        issuedOn:  cert.issuedOn,
        accountId: cert.accountName,
        verifyUrl: `${verifyBase}/certificate/verify/${cert.accountName}`,
      });
    } else {
      pngBuffer = await generatePayoutCertificatePng({
        name:      cert.name,
        amount:    Number(cert.payoutAmount).toFixed(2),
        issuedOn:  cert.issuedOn,
        verifyUrl: `${verifyBase}/certificate/payout/verify/${cert._id}`,
      });
    }

    res.set({ "Content-Type": "image/png", "Cache-Control": "no-store" });
    res.send(pngBuffer);
  } catch (error) {
    console.error("Preview demo certificate error:", error);
    res.status(500).json({ errMsg: "Failed to generate preview" });
  }
};

const verifyAccountCertificate = async (req, res) => {
  try {
    const { accountName } = req.params;
    if (!accountName) return res.status(400).json({ valid: false, errMsg: "Account name is required" });

    // 1. Check real accounts first
    const account = await Account.findOne({ accountName }).populate("userId", "first_name last_name email");

    if (account) {
      if (account.status !== "Passed") {
        return res.status(403).json({
          valid: false,
          errMsg: "This account has not passed verification",
          status: account.status,
        });
      }
      return res.status(200).json({
        valid: true,
        fullName:    account.name,
        accountName: account.accountName,
        phase:       account.phase,
        platform:    account.platform,
        accountSize: `$${account.amountSize.toLocaleString()}`,
        issuedOn:    account.approvedDate || account.createdAt,
        status:      account.status,
      });
    }

    // 2. Fallback: check demo certificates
    const DemoCertificate = require("../models/demoCertificate");

    const demoCert = await DemoCertificate.findOne({ accountName, type: "account" });
    if (!demoCert) return res.status(404).json({ valid: false, errMsg: "Certificate not found" });

    return res.status(200).json({
      valid:       true,
      fullName:    demoCert.name,
      accountName: demoCert.accountName,
      phase:       demoCert.phase || "N/A",
      platform:    demoCert.platform || "N/A",
      accountSize: demoCert.amountSize ? `$${demoCert.amountSize.toLocaleString()}` : "N/A",
      issuedOn:    demoCert.issuedOn,
      status:      "Passed",
    });

  } catch (error) {
    console.error("Certificate verify error:", error);
    res.status(500).json({ valid: false, errMsg: "Server error", error: error.message });
  }
};

const verifyPayoutCertificate = async (req, res) => {
  try {
    const { payoutId } = req.params;
    if (!payoutId) return res.status(400).json({ valid: false, errMsg: "Payout ID is required" });

    // 1. Try real payout
    const payout = await Payout.findById(payoutId)
      .populate("account", "accountName platform amountSize")
      .populate("userId", "first_name last_name email");

    if (payout) {
      if (payout.status !== "Processed") {
        return res.status(403).json({
          valid: false,
          errMsg: "This payout has not been processed yet",
          status: payout.status,
        });
      }
      return res.status(200).json({
        valid:         true,
        fullName:      payout.name,
        email:         payout.mail,
        amount:        `$${Number(payout.amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        accountName:   payout.account?.accountName || "—",
        platform:      payout.platform || payout.account?.platform || "—",
        paymentMethod: payout.paymentMethod,
        requestedOn:   payout.requestedOn || payout.createdAt,
        processedOn:   payout.approvedDate || null,
        status:        payout.status,
        txnId:         payout.txnId || null,
      });
    }


    const demoCert = await DemoCertificate.findById(payoutId);
    if (!demoCert || demoCert.type !== "payout") {
      return res.status(404).json({ valid: false, errMsg: "Certificate not found" });
    }

    return res.status(200).json({
      valid:         true,
      fullName:      demoCert.name,
      amount:        `$${Number(demoCert.payoutAmount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      platform:      demoCert.payoutPlatform || "—",
      paymentMethod: demoCert.paymentMethod || "—",
      requestedOn:   demoCert.issuedOn,
      processedOn:   demoCert.issuedOn,
      status:        "Processed",
    });

  } catch (error) {
    console.error("Payout certificate verify error:", error);
    res.status(500).json({ valid: false, errMsg: "Server error", error: error.message });
  }
};

const downloadDemoCertificate = async (req, res) => {
  try {
    const cert = await DemoCertificate.findById(req.params.id);
    if (!cert) return res.status(404).json({ errMsg: "Demo certificate not found" });

    let pngBuffer;
    const verifyBase = process.env.FRONTEND_URL;

    if (cert.type === "account") {
      pngBuffer = await generateCertificate({
        name:      cert.name,
        issuedOn:  cert.issuedOn,
        accountId: cert.accountName,
        verifyUrl: `${verifyBase}/certificate/verify/${cert.accountName}`,
      });
    } else {
      pngBuffer = await generatePayoutCertificatePng({
        name:      cert.name,
        amount:    Number(cert.payoutAmount).toFixed(2),
        issuedOn:  cert.issuedOn,
        verifyUrl: `${verifyBase}/certificate/payout/verify/${cert._id}`,
      });
    }

    const filename = `${cert.name.replace(/\s+/g, "_")}_${cert.type === "account" ? cert.phase?.replace(/\s+/g, "_") : "Reward"}_Certificate.png`;

    res.set({
      "Content-Type":        "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":       pngBuffer.length,
      "Cache-Control":        "no-store",
    });

    res.send(pngBuffer);
  } catch (error) {
    console.error("Download demo certificate error:", error);
    res.status(500).json({ errMsg: "Failed to download certificate" });
  }
};

module.exports = {
  createDemoCertificate,
  listDemoCertificates,
  previewDemoCertificate,
  verifyAccountCertificate ,
  downloadDemoCertificate,
  verifyPayoutCertificate
};