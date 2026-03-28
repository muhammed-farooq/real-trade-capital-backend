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
    const verifyUrl = `${process.env.FRONTEND_URL}/payout/verify/${payoutId}`;
 
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

// const generateAccountCertificate = async (req, res) => {
//   try {
//     const accountId = req.params.id;
//     const userId = req.payload.id;

//     if (!accountId) {
//       return res.status(400).json({ errMsg: "Account ID is undefined" });
//     }
//     if (!userId) {
//       return res.status(400).json({ errMsg: "User ID is undefined" });
//     }

//     const accountDetails = await Account.findById(accountId, {
//       amount: 1,
//       name: 1,
//       requestedOn: 1,
//       phase: 1,
//       step: 1,
//       toPhaseTwoOn: 1,
//       passedOn: 1,
//     });

//     if (!accountDetails) {
//       return res.status(404).json({ errMsg: "Account not found" });
//     }

//     const userName = accountDetails.name;
//     let phaseFrom, phaseTo, accountDate;

//     // Handle phases and date logic
//     if (accountDetails.phase === "Phase Two") {
//       accountDate = accountDetails.toPhaseTwoOn.toLocaleDateString();
//       phaseFrom = "Phase One";
//       phaseTo = "Phase Two";
//     } else if (accountDetails.phase === "Funded") {
//       phaseFrom = accountDetails.step === "stepOne" ? "Phase One" : "Phase Two";
//       phaseTo = "Funded";
//       accountDate = accountDetails.passedOn.toLocaleDateString();
//     }

//     // Load images
//     const backgroundImagePath = path.resolve("assets/img/certificateBg.png");
//     const logoPath = path.resolve("assets/img/Logo.png");
//     const signature = path.resolve("assets/img/signature.png");
//     const gift = path.resolve("assets/img/tag.png");

//     const doc = new PDFDocument({
//       layout: "landscape",
//       size: "A4",
//       margins: { top: 0, bottom: 0, left: 0, right: 0 },
//     });

//     const pdfBuffer = await new Promise((resolve, reject) => {
//       const buffers = [];

//       doc.on("data", buffers.push.bind(buffers));
//       doc.on("end", () => resolve(Buffer.concat(buffers)));

//       // Add the background
//       doc.image(backgroundImagePath, 0, 0, {
//         width: doc.page.width,
//         height: doc.page.height,
//       });

//       // Add the logo, center horizontally
//       const logoWidth = 180;
//       const logoXPosition = (doc.page.width - logoWidth) / 2;
//       doc.image(logoPath, logoXPosition, 80, { width: logoWidth });

//       // Certificate Title
//       doc
//         .font("assets/fonts/Shoika Retina.ttf")
//         .fontSize(32)
//         .fillColor("#000000")
//         .text("CERTIFICATE", 0, 150, { align: "center" });

//       doc
//         .font("assets/fonts/Shoika Retina.ttf")
//         .fontSize(18)
//         .fillColor("#000000")
//         .text("OF ACHIEVEMENT", 0, 185, { align: "center" });

//       // Certificate description
//       doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .fontSize(18)
//         .fillColor("#000000")
//         .text("This certificate is proudly presented to:", 0, 220, {
//           align: "center",
//         });

//       // Trader Name
//       doc
//         .font("assets/fonts/GoodVibrations-Script-400.ttf")
//         .fontSize(48)
//         .fillColor("#000000")
//         .text(userName, 0, 250, { align: "center" });

//       // Red Line under the name
//       const lineWidth = 500;
//       const lineXPosition = (doc.page.width - lineWidth) / 2;
//       doc
//         .moveTo(lineXPosition, 315)
//         .lineTo(lineXPosition + lineWidth, 315)
//         .lineWidth(2)
//         .strokeColor("#ff0000")
//         .stroke();

//       // Additional certificate text
//       doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .fillColor("#000000")
//         .fontSize(16)
//         .text(
//           "This certificate is proudly presented by Real Trade Capital to acknowledge",
//           0,
//           335,
//           { align: "center" }
//         );

//       doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .fillColor("#000000")
//         .fontSize(16)
//         .text(
//           "that the trader has demonstrated advanced trading skills, successfully",
//           0,
//           355,
//           { align: "center" }
//         );
//       // Measure the width of each part of the text
//       const passedToWidth = doc.widthOfString("passed to ");
//       const phaseToWidth = doc
//         .font("assets/fonts/Shoika Bold.ttf")
//         .widthOfString(phaseTo);
//       const andCompletedWidth = doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .widthOfString(", and has completed the ");
//       const phaseFromWidth = doc
//         .font("assets/fonts/Shoika Bold.ttf")
//         .widthOfString(phaseFrom);
//       const periodWidth = doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .widthOfString(".");

//       // Calculate the total width of the entire line
//       const totalWidth =
//         passedToWidth +
//         phaseToWidth +
//         andCompletedWidth +
//         phaseFromWidth +
//         periodWidth;

//       // Calculate the starting X position to center the text
//       const startX = (doc.page.width - totalWidth) / 2;

//       // Reset to regular font for the first part
//       doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .fillColor("#000000")
//         .fontSize(16)
//         .text("passed to ", startX, 375, {
//           continued: true,
//         });

//       // Switch to bold for the phaseTo part
//       doc.font("assets/fonts/Shoika Bold.ttf").text(phaseTo, {
//         continued: true,
//       });

//       // Switch back to regular font for the next part
//       doc
//         .font("assets/fonts/Shoika Regular.ttf")
//         .text(", and has completed the ", {
//           continued: true,
//         });

//       // Bold for the phaseFrom part
//       doc.font("assets/fonts/Shoika Bold.ttf").text(phaseFrom, {
//         continued: true,
//       });

//       // End the sentence with a period
//       doc.font("assets/fonts/Shoika Regular.ttf").text(".");

//       // Date section
//       doc.fontSize(14).text(accountDate, 200, 430, { align: "left" });
//       doc.fontSize(14).text("Date", 215, 450, { align: "left" });

//       // Images and signature
//       doc.image(gift, doc.page.width / 2 - 75, 400, { width: 150 });
//       doc.image(signature, 475, 400, { width: 250 });
//       doc.fontSize(14).text("Sebastian Marcellus CEO", 530, 450, { align: "left" });

//       doc.end();
//     });

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": 'inline; filename="certificate.pdf"',
//     });
//     res.send(pdfBuffer);
//   } catch (error) {
//     console.error("Error generating certificate:", error);
//     res.status(500).send("Error generating certificate");
//   }
// };

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

const verifyCertificate = async (req, res) => {
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

module.exports = {
  generatePayoutCertificate,
  getCertificates,
  downloadCertificate,
  previewCertificate,
  verifyCertificate
};
