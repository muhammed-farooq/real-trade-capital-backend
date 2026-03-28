const PDFDocument = require("pdfkit");
const User = require("../models/user");
const Payout = require("../models/payout");
const path = require("path");
const Account = require("../models/account");
const { generateCertificate } = require("../utils/certificateGenerator");
const { generatePayoutCertificatePng } = require("../utils/payoutCertificateGenerator");

const generatePayoutCertificate = async (req, res) => {
  try {
    const payoutId = req.params.id;
    const userId   = req.payload.id;
 
    if (!payoutId) return res.status(400).json({ errMsg: "Payout ID is undefined" });
    if (!userId)   return res.status(400).json({ errMsg: "User ID is undefined" });
 
    const payoutDetails = await Payout.findById(payoutId, {
      amount: 1,
      requestedOn: 1,
      name: 1,
    });
    if (!payoutDetails) return res.status(404).json({ errMsg: "Payout not found" });
 
    const payoutAmount = payoutDetails.amount.toFixed(2);
    const payoutDate   = payoutDetails.requestedOn;
    const userName     = payoutDetails.name;
 
    // Build verify URL so QR code links somewhere meaningful
    const verifyUrl = `${process.env.FRONTEND_URL}/certificate/payout/verify/${payoutId}`;
 
    const pngBuffer = await generatePayoutCertificatePng({
      name:      userName,
      amount:    payoutAmount,
      issuedOn:  payoutDate,
      verifyUrl,
    });
 
    const filename = `${userName.replace(/\s+/g, "_")}_Reward_Certificate.png`;
 
    res.set({
      "Content-Type":        "image/png",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length":       pngBuffer.length,
      "Cache-Control":        "no-store",
    });
 
    res.send(pngBuffer);
  } catch (error) {
    console.error("Error generating payout certificate:", error);
    res.status(500).send("Error generating certificate");
  }
};

const getCertificates = async (req,res)=>{
  try {
    const userId = req.params.id;
    const accounts = await Account.find({
      userId,
      status: { $in: ["Passed", "Ongoing"] }
    }).sort({ createdAt: -1 });
    res.status(200).json({ allAccounts: accounts });
  } catch (error) {
    console.log(error)
    res.status(500).json({ msg: "Server error" });
  }
}

const downloadCertificate = async(req,res)=>{
   try {
    const { accountId } = req.params;
    const userId        = req.user._id;
 
    // Fetch the account — must belong to this user and be in Passed status
    const account = await Account.findOne({
      _id:    accountId,
      userId: userId,
    });
 
    if (!account) {
      return res.status(404).json({ errMsg: "Account not found" });
    }
 
    // Only issue certificates for passed accounts
    if (account.status !== "Passed") {
      return res.status(403).json({ errMsg: "Certificate not available for this account" });
    }
 
    // Generate certificate
    const pngBuffer = await generateCertificate({
      name:      account.name,
      issuedOn:  account.approvedDate || account.createdAt,
      accountId: account.accountName,
      verifyUrl: `${process.env.FRONTEND_URL}/certificate/verify/${account.accountName}`,
    });
 
    // Stream PNG to client
    const filename = `${account.name.replace(/\s+/g, "_")}_${account.phase.replace(/\s+/g, "_")}_Certificate.png`;
 
    res.set({
      "Content-Type":        "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length":       pngBuffer.length,
      "Cache-Control":        "no-store",
    });
 
    res.send(pngBuffer);
 
  } catch (error) {
    console.error("Certificate generation error:", error);
    res.status(500).json({ errMsg: "Failed to generate certificate", error: error.message });
  }
}

const previewCertificate = async(req,res)=>{
   try {
    const { accountId } = req.params;
    const userId        = req.user._id;
 
    const account = await Account.findOne({ _id: accountId, userId });
 
    if (!account || account.status !== "Passed") {
      return res.status(403).json({ errMsg: "Certificate not available" });
    }
 
    const pngBuffer = await generateCertificate({
      name:      account.name,
      issuedOn:  account.approvedDate || account.createdAt,
      accountId: account.accountName,
      verifyUrl: `${process.env.FRONTEND_URL}/certificate/verify/${account.accountName}`,
    });
 
    res.set({
      "Content-Type":  "image/png",
      "Cache-Control": "private, max-age=3600", // cache for 1hr
    });
 
    res.send(pngBuffer);
 
  } catch (error) {
    console.error("Certificate preview error:", error);
    res.status(500).json({ errMsg: "Failed to generate preview", error: error.message });
  }
} 

const verifyAccountCertificate = async (req, res) => {
  try {
    const { accountName } = req.params;

    if (!accountName) {
      return res.status(400).json({ valid: false, errMsg: "Account name is required" });
    }

    const account = await Account.findOne({ accountName }).populate("userId", "first_name last_name email");

    if (!account) {
      return res.status(404).json({ valid: false, errMsg: "Certificate not found" });
    }

    // Only passed accounts have valid certificates
    if (account.status !== "Passed") {
      return res.status(403).json({
        valid:   false,
        errMsg:  "This account has not passed verification",
        status:  account.status,
      });
    }

    return res.status(200).json({
      valid:       true,
      fullName:    account.name,
      accountName: account.accountName,
      phase:       account.phase,
      platform:    account.platform,
      accountSize: `$${account.amountSize.toLocaleString()}`,
      issuedOn:    account.approvedDate || account.createdAt,
      status:      account.status,
    });

  } catch (error) {
    console.error("Certificate verify error:", error);
    res.status(500).json({ valid: false, errMsg: "Server error", error: error.message });
  }
};

const verifyPayoutCertificate = async (req, res) => {
  try {
    const { payoutId } = req.params;
 
    if (!payoutId) {
      return res.status(400).json({ valid: false, errMsg: "Payout ID is required" });
    }
 
    const payout = await Payout.findById(payoutId)
      .populate("account", "accountName platform amountSize")
      .populate("userId",  "first_name last_name email");
 
    if (!payout) {
      return res.status(404).json({ valid: false, errMsg: "Certificate not found" });
    }
 
    if (payout.status !== "Processed") {
      return res.status(403).json({
        valid:  false,
        errMsg: "This payout has not been processed yet",
        status: payout.status,
      });
    }
 
    return res.status(200).json({
      valid:         true,
      fullName:      payout.name,
      email:         payout.mail,
      amount:        `$${Number(payout.amount).toLocaleString("en-US", {
                       minimumFractionDigits: 2,
                       maximumFractionDigits: 2,
                     })}`,
      accountName:   payout.account?.accountName || "—",
      platform:      payout.platform || payout.account?.platform || "—",
      paymentMethod: payout.paymentMethod,
      requestedOn:   payout.requestedOn || payout.createdAt,
      processedOn:   payout.approvedDate || null,
      status:        payout.status,
      txnId:         payout.txnId || null,
    });
 
  } catch (error) {
    console.error("Payout certificate verify error:", error);
    res.status(500).json({ valid: false, errMsg: "Server error", error: error.message });
  }
};

module.exports = {
  generatePayoutCertificate,
  getCertificates,
  downloadCertificate,
  previewCertificate,
  verifyAccountCertificate ,
  verifyPayoutCertificate
};
