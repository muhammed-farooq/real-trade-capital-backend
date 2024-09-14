const PDFDocument = require("pdfkit");
const User = require("../models/user");
const Payout = require("../models/payout");
const path = require("path");
const Account = require("../models/account");

// Create a new PDF document
// const doc = new PDFDocument({ layout: "landscape", size: "A4" });
// const imagePath = path.join(__dirname, "../assets/img/Logo.png");
// console.log("Image Path:", imagePath);

// // Add your company's logo
// doc.image(imagePath, 100, 100, { width: 100 }); // Adjust path and dimensions as needed

// // Title
// doc
//   .fontSize(30)
//   .text("Certificate of Achievement", 150, 100, { align: "center" });

// // Recipient Name
// doc
//   .fontSize(20)
//   .text(`This certifies that ${userName}`, { align: "center" });

// // Certificate Body Content
// doc
//   .moveDown()
//   .fontSize(16)
//   .text(
//     `has successfully completed the requirements for a payout of $${payoutAmount} on our trading platform.`,
//     { align: "center" }
//   );

// doc
//   .moveDown()
//   .fontSize(16)
//   .text(`Date of payout request: ${payoutDate}`, { align: "center" });

// // Add Social Media Links
// doc.moveDown().fontSize(12).text("Follow us on:", { align: "center" });
// doc.fontSize(12).text("Facebook | Twitter | Instagram", {
//   align: "center",
//   link: "https://facebook.com",
// });

// const generatePayoutCertificate = async (req, res) => {
//   try {
//     const payoutId = req.params.id;
//     const userId = req.payload.id;

//     if (!payoutId) {
//       return res.status(400).json({ errMsg: "Payout ID is undefined" });
//     }
//     if (!userId) {
//       return res.status(400).json({ errMsg: "User ID is undefined" });
//     }

//     const payoutDetails = await Payout.findById(payoutId, {
//       amount: 1,
//       requestedOn: 1,
//       name: 1,
//     });
//     if (!payoutDetails) {
//       return res.status(404).json({ errMsg: "Payout not found" });
//     }

//     const payoutAmount = payoutDetails.amount.toFixed(2); // Convert amount to two decimal places
//     const payoutDate = payoutDetails.requestedOn.toLocaleDateString(); // Format the date
//     const userName = payoutDetails.name.toUpperCase();

//     const doc = new PDFDocument({
//       layout: "landscape",
//       size: "A4",
//     });

//     // Helper to move to next line
//     function jumpLine(doc, lines) {
//       for (let index = 0; index < lines; index++) {
//         doc.moveDown();
//       }
//     }

//     // doc.pipe(res);
//     doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff");
//     doc.fontSize(10);

//     // Margin
//     const distanceMargin = 18;

//     doc
//       .fillAndStroke("#0e8cc3")
//       .lineWidth(20)
//       .lineJoin("round")
//       .rect(
//         distanceMargin,
//         distanceMargin,
//         doc.page.width - distanceMargin * 2,
//         doc.page.height - distanceMargin * 2
//       )
//       .stroke();

//     // Header
//     const maxWidth = 200;
//     const maxHeight = 90;

//     doc.image("assets/img/Logo.png", doc.page.width / 2 - maxWidth / 2, 50, {
//       fit: [maxWidth, maxHeight],
//       align: "center",
//     });

//     jumpLine(doc, 5);

//     doc
//       .font("assets/fonts/NotoSansJP-Light.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Super Course for Awesomes", {
//         align: "center",
//       });

//     jumpLine(doc, 2);

//     // Content
//     doc
//       .font("assets/fonts/NotoSansJP-Regular.otf")
//       .fontSize(16)
//       .fill("#021c27")
//       .text("CERTIFICATE OF COMPLETION", {
//         align: "center",
//       });

//     jumpLine(doc, 1);

//     doc
//       .font("assets/fonts/NotoSansJP-Light.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Present to", {
//         align: "center",
//       });

//     jumpLine(doc, 2);

//     doc
//       .font("assets/fonts/NotoSansJP-Bold.otf")
//       .fontSize(24)
//       .fill("#021c27")
//       .text(userName.toUpperCase(), {
//         align: "center",
//       });

//     jumpLine(doc, 1);

//     doc
//       .font("assets/fonts/NotoSansJP-Light.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Successfully completed the Super Course for Awesomes.", {
//         align: "center",
//       });

//     jumpLine(doc, 7);

//     doc.lineWidth(1);

//     // Signatures
//     const lineSize = 174;
//     const signatureHeight = 390;

//     doc.fillAndStroke("#021c27");
//     doc.strokeOpacity(0.2);

//     const startLine1 = 128;
//     const endLine1 = 128 + lineSize;
//     doc
//       .moveTo(startLine1, signatureHeight)
//       .lineTo(endLine1, signatureHeight)
//       .stroke();

//     const startLine2 = endLine1 + 32;
//     const endLine2 = startLine2 + lineSize;
//     doc
//       .moveTo(startLine2, signatureHeight)
//       .lineTo(endLine2, signatureHeight)
//       .stroke();

//     const startLine3 = endLine2 + 32;
//     const endLine3 = startLine3 + lineSize;
//     doc
//       .moveTo(startLine3, signatureHeight)
//       .lineTo(endLine3, signatureHeight)
//       .stroke();

//     doc
//       .font("assets/fonts/NotoSansJP-Bold.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Ramees Mohd", startLine1, signatureHeight + 10, {
//         columns: 1,
//         columnGap: 0,
//         height: 40,
//         width: lineSize,
//         align: "center",
//       });

//     doc
//       .font("assets/fonts/NotoSansJP-Light.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Associate Professor", startLine1, signatureHeight + 25, {
//         columns: 1,
//         columnGap: 0,
//         height: 40,
//         width: lineSize,
//         align: "center",
//       });

//     doc
//       .font("assets/fonts/NotoSansJP-Bold.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text(
//         userName.charAt(0).toUpperCase() + userName.slice(1),
//         startLine2,
//         signatureHeight + 10,
//         {
//           columns: 1,
//           columnGap: 0,
//           height: 40,
//           width: lineSize,
//           align: "center",
//         }
//       );

//     doc
//       .font("assets/fonts/NotoSansJP-Light.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Student", startLine2, signatureHeight + 25, {
//         columns: 1,
//         columnGap: 0,
//         height: 40,
//         width: lineSize,
//         align: "center",
//       });

//     doc
//       .font("assets/fonts/NotoSansJP-Bold.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Sanoob Thadiyam", startLine3, signatureHeight + 10, {
//         columns: 1,
//         columnGap: 0,
//         height: 40,
//         width: lineSize,
//         align: "center",
//       });

//     doc
//       .font("assets/fonts/NotoSansJP-Light.otf")
//       .fontSize(10)
//       .fill("#021c27")
//       .text("Director", startLine3, signatureHeight + 25, {
//         columns: 1,
//         columnGap: 0,
//         height: 40,
//         width: lineSize,
//         align: "center",
//       });

//     jumpLine(doc, 4);

//     // Generate PDF buffer
//     const pdfBuffer = await new Promise((resolve, reject) => {
//       const buffers = [];
//       doc.on("data", buffers.push.bind(buffers));
//       doc.on("end", () => resolve(Buffer.concat(buffers)));
//       doc.end(); // End the PDF generation
//     });
//     console.log(pdfBuffer);

//     // Set response headers and send the PDF
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

const generatePayoutCertificate = async (req, res) => {
  try {
    const payoutId = req.params.id;
    const userId = req.payload.id;

    if (!payoutId) {
      return res.status(400).json({ errMsg: "Payout ID is undefined" });
    }
    if (!userId) {
      return res.status(400).json({ errMsg: "User ID is undefined" });
    }

    const payoutDetails = await Payout.findById(payoutId, {
      amount: 1,
      requestedOn: 1,
      name: 1,
    });
    if (!payoutDetails) {
      return res.status(404).json({ errMsg: "Payout not found" });
    }

    const payoutAmount = payoutDetails.amount.toFixed(2);
    const payoutDate = payoutDetails.requestedOn.toLocaleDateString();
    const userName = payoutDetails.name;

    // Load the background and logo image paths
    const backgroundImagePath = path.resolve("assets/img/certificateBg.png");
    const logoPath = path.resolve("assets/img/Logo.png");
    const signature = path.resolve("assets/img/signature.png");

    // Initialize the PDF document
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4", // Ensures the correct size is used for a single page.
      margins: { top: 0, bottom: 0, left: 0, right: 0 }, // Remove margins for full background usage
    });

    // Create a buffer for the PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Add the background image
      doc.image(backgroundImagePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
      });

      const logoWidth = 180;
      const pageWidth = doc.page.width;
      const logoXPosition = (pageWidth - logoWidth) / 2;

      doc.image(logoPath, logoXPosition, 80, {
        width: logoWidth,
      });
      doc
        .font("assets/fonts/Shoika Retina.ttf")
        .fontSize(32)
        .fillColor("#000000")
        .text("Profit Allocation", 0, 150, {
          align: "center",
        });
      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fontSize(18)
        .fillColor("#000000")
        .text("This certificate is proudly presented to:", 0, 200, {
          align: "center",
        });
      doc
        .font("assets/fonts/GoodVibrations-Script-400.ttf")
        .fontSize(52)
        .fillColor("#000000")
        .text(userName, 0, 230, {
          align: "center",
        });
      // Add red line
      const lineWidth = 500; // Desired width of the line
      const lineXPosition = (doc.page.width - lineWidth) / 2; // Center the line horizontally
      doc
        .moveTo(lineXPosition, 300) // Starting position (300 is Y position)
        .lineTo(lineXPosition + lineWidth, 300) // Ending position
        .lineWidth(2) // Thickness of the line
        .strokeColor("#ff0000") // Red color
        .stroke(); // Draw the line

      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fontSize(18)
        .fillColor("#000000")
        .text("Your Profit Share:", 0, 320, {
          align: "center",
        });
      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fontSize(30)
        .fillColor("#000000")
        .text(`$${payoutAmount}`, 0, 350, {
          align: "center",
        });
      doc
        .fontSize(14)
        .font("assets/fonts/Shoika Regular.ttf")
        .fillColor("#000000")
        .text(payoutDate, 200, 430, {
          align: "left",
        });
      doc.fontSize(14).text("Date", 215, 450, {
        align: "left",
      });
      doc.image(signature, 475, 400, {
        align: "left",
        width: 250,
      });
      doc.fontSize(14).text("Francois Mercer CEO", 530, 450, {
        align: "left",
      });
      doc.end();
    });

    // Send the response with the PDF buffer
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="certificate.pdf"',
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).send("Error generating certificate");
  }
};

const generateAccountCertificate = async (req, res) => {
  try {
    const accountId = req.params.id;
    const userId = req.payload.id;

    if (!accountId) {
      return res.status(400).json({ errMsg: "Account ID is undefined" });
    }
    if (!userId) {
      return res.status(400).json({ errMsg: "User ID is undefined" });
    }

    const accountDetails = await Account.findById(accountId, {
      amount: 1,
      name: 1,
      requestedOn: 1,
      phase: 1,
      step: 1,
      toPhaseTwoOn: 1,
      passedOn: 1,
    });

    if (!accountDetails) {
      return res.status(404).json({ errMsg: "Account not found" });
    }

    const userName = accountDetails.name;
    let phaseFrom, phaseTo, accountDate;

    // Handle phases and date logic
    if (accountDetails.phase === "Phase Two") {
      accountDate = accountDetails.toPhaseTwoOn.toLocaleDateString();
      phaseFrom = "Phase One";
      phaseTo = "Phase Two";
    } else if (accountDetails.phase === "Funded") {
      phaseFrom = accountDetails.step === "stepOne" ? "Phase One" : "Phase Two";
      phaseTo = "Funded";
      accountDate = accountDetails.passedOn.toLocaleDateString();
    }

    // Load images
    const backgroundImagePath = path.resolve("assets/img/certificateBg.png");
    const logoPath = path.resolve("assets/img/Logo.png");
    const signature = path.resolve("assets/img/signature.png");
    const gift = path.resolve("assets/img/tag.png");

    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
    });

    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      // Add the background
      doc.image(backgroundImagePath, 0, 0, {
        width: doc.page.width,
        height: doc.page.height,
      });

      // Add the logo, center horizontally
      const logoWidth = 180;
      const logoXPosition = (doc.page.width - logoWidth) / 2;
      doc.image(logoPath, logoXPosition, 80, { width: logoWidth });

      // Certificate Title
      doc
        .font("assets/fonts/Shoika Retina.ttf")
        .fontSize(32)
        .fillColor("#000000")
        .text("CERTIFICATE", 0, 150, { align: "center" });

      doc
        .font("assets/fonts/Shoika Retina.ttf")
        .fontSize(18)
        .fillColor("#000000")
        .text("OF ACHIEVEMENT", 0, 185, { align: "center" });

      // Certificate description
      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fontSize(18)
        .fillColor("#000000")
        .text("This certificate is proudly presented to:", 0, 220, {
          align: "center",
        });

      // Trader Name
      doc
        .font("assets/fonts/GoodVibrations-Script-400.ttf")
        .fontSize(48)
        .fillColor("#000000")
        .text(userName, 0, 250, { align: "center" });

      // Red Line under the name
      const lineWidth = 500;
      const lineXPosition = (doc.page.width - lineWidth) / 2;
      doc
        .moveTo(lineXPosition, 315)
        .lineTo(lineXPosition + lineWidth, 315)
        .lineWidth(2)
        .strokeColor("#ff0000")
        .stroke();

      // Additional certificate text
      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fillColor("#000000")
        .fontSize(16)
        .text(
          "This certificate is proudly presented by Real Trade Capital to acknowledge",
          0,
          335,
          { align: "center" }
        );

      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fillColor("#000000")
        .fontSize(16)
        .text(
          "that the trader has demonstrated advanced trading skills, successfully",
          0,
          355,
          { align: "center" }
        );
      // Measure the width of each part of the text
      const passedToWidth = doc.widthOfString("passed to ");
      const phaseToWidth = doc
        .font("assets/fonts/Shoika Bold.ttf")
        .widthOfString(phaseTo);
      const andCompletedWidth = doc
        .font("assets/fonts/Shoika Regular.ttf")
        .widthOfString(", and has completed the ");
      const phaseFromWidth = doc
        .font("assets/fonts/Shoika Bold.ttf")
        .widthOfString(phaseFrom);
      const periodWidth = doc
        .font("assets/fonts/Shoika Regular.ttf")
        .widthOfString(".");

      // Calculate the total width of the entire line
      const totalWidth =
        passedToWidth +
        phaseToWidth +
        andCompletedWidth +
        phaseFromWidth +
        periodWidth;

      // Calculate the starting X position to center the text
      const startX = (doc.page.width - totalWidth) / 2;

      // Reset to regular font for the first part
      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .fillColor("#000000")
        .fontSize(16)
        .text("passed to ", startX, 375, {
          continued: true,
        });

      // Switch to bold for the phaseTo part
      doc.font("assets/fonts/Shoika Bold.ttf").text(phaseTo, {
        continued: true,
      });

      // Switch back to regular font for the next part
      doc
        .font("assets/fonts/Shoika Regular.ttf")
        .text(", and has completed the ", {
          continued: true,
        });

      // Bold for the phaseFrom part
      doc.font("assets/fonts/Shoika Bold.ttf").text(phaseFrom, {
        continued: true,
      });

      // End the sentence with a period
      doc.font("assets/fonts/Shoika Regular.ttf").text(".");

      // Date section
      doc.fontSize(14).text(accountDate, 200, 430, { align: "left" });
      doc.fontSize(14).text("Date", 215, 450, { align: "left" });

      // Images and signature
      doc.image(gift, doc.page.width / 2 - 75, 400, { width: 150 });
      doc.image(signature, 475, 400, { width: 250 });
      doc.fontSize(14).text("Francois Mercer CEO", 530, 450, { align: "left" });

      doc.end();
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="certificate.pdf"',
    });
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).send("Error generating certificate");
  }
};

module.exports = {
  generatePayoutCertificate,
  generateAccountCertificate,
};
