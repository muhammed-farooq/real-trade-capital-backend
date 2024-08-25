const PDFDocument = require("pdfkit"); // Ensure you have pdfkit installed
const User = require("../models/user"); // Adjust the path according to your project structure
const Payout = require("../models/payout"); // Adjust the path according to your project structure
const path = require("path");
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

    // Find user details using userId
    const userData = await User.findById(userId, {
      first_name: 1,
      last_name: 1,
    });

    // Check if user exists
    if (!userData) {
      return res.status(404).json({ errMsg: "User not found" });
    }

    const userName =
      `${userData.first_name} ${userData.last_name}`.toUpperCase();

    // Find payout details using payoutId
    const payoutDetails = await Payout.findById(payoutId, {
      amount: 1,
      requestedOn: 1,
    });
    if (!payoutDetails) {
      return res.status(404).json({ errMsg: "Payout not found" });
    }

    const payoutAmount = payoutDetails.amount.toFixed(2); // Convert amount to two decimal places
    const payoutDate = payoutDetails.requestedOn.toLocaleDateString(); // Format the date

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
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
    });

    // Helper to move to next line
    function jumpLine(doc, lines) {
      for (let index = 0; index < lines; index++) {
        doc.moveDown();
      }
    }

    // doc.pipe(res);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff");
    doc.fontSize(10);

    // Margin
    const distanceMargin = 18;

    doc
      .fillAndStroke("#0e8cc3")
      .lineWidth(20)
      .lineJoin("round")
      .rect(
        distanceMargin,
        distanceMargin,
        doc.page.width - distanceMargin * 2,
        doc.page.height - distanceMargin * 2
      )
      .stroke();

    // Header
    const maxWidth = 200;
    const maxHeight = 90;

    doc.image("assets/img/Logo.png", doc.page.width / 2 - maxWidth / 2, 50, {
      fit: [maxWidth, maxHeight],
      align: "center",
    });

    jumpLine(doc, 5);

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Super Course for Awesomes", {
        align: "center",
      });

    jumpLine(doc, 2);

    // Content
    doc
      .font("assets/fonts/NotoSansJP-Regular.otf")
      .fontSize(16)
      .fill("#021c27")
      .text("CERTIFICATE OF COMPLETION", {
        align: "center",
      });

    jumpLine(doc, 1);

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Present to", {
        align: "center",
      });

    jumpLine(doc, 2);

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(24)
      .fill("#021c27")
      .text(userName.toUpperCase(), {
        align: "center",
      });

    jumpLine(doc, 1);

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Successfully completed the Super Course for Awesomes.", {
        align: "center",
      });

    jumpLine(doc, 7);

    doc.lineWidth(1);

    // Signatures
    const lineSize = 174;
    const signatureHeight = 390;

    doc.fillAndStroke("#021c27");
    doc.strokeOpacity(0.2);

    const startLine1 = 128;
    const endLine1 = 128 + lineSize;
    doc
      .moveTo(startLine1, signatureHeight)
      .lineTo(endLine1, signatureHeight)
      .stroke();

    const startLine2 = endLine1 + 32;
    const endLine2 = startLine2 + lineSize;
    doc
      .moveTo(startLine2, signatureHeight)
      .lineTo(endLine2, signatureHeight)
      .stroke();

    const startLine3 = endLine2 + 32;
    const endLine3 = startLine3 + lineSize;
    doc
      .moveTo(startLine3, signatureHeight)
      .lineTo(endLine3, signatureHeight)
      .stroke();

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Ramees Mohd", startLine1, signatureHeight + 10, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Associate Professor", startLine1, signatureHeight + 25, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(10)
      .fill("#021c27")
      .text(
        userName.charAt(0).toUpperCase() + userName.slice(1),
        startLine2,
        signatureHeight + 10,
        {
          columns: 1,
          columnGap: 0,
          height: 40,
          width: lineSize,
          align: "center",
        }
      );

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Student", startLine2, signatureHeight + 25, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Sanoob Thadiyam", startLine3, signatureHeight + 10, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Director", startLine3, signatureHeight + 25, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    jumpLine(doc, 4);

    // Generate PDF buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.end(); // End the PDF generation
    });
    console.log(pdfBuffer);

    // Set response headers and send the PDF
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
    const payoutId = req.params.id;
    const userId = req.payload.id;

    if (!payoutId) {
      return res.status(400).json({ errMsg: "Payout ID is undefined" });
    }
    if (!userId) {
      return res.status(400).json({ errMsg: "User ID is undefined" });
    }

    // Find user details using userId
    const userData = await User.findById(userId, {
      first_name: 1,
      last_name: 1,
    });

    // Check if user exists
    if (!userData) {
      return res.status(404).json({ errMsg: "User not found" });
    }

    const userName =
      `${userData.first_name} ${userData.last_name}`.toUpperCase();

    // Find payout details using payoutId
    const payoutDetails = await Payout.findById(payoutId, {
      amount: 1,
      requestedOn: 1,
    });
    if (!payoutDetails) {
      return res.status(404).json({ errMsg: "Payout not found" });
    }

    const payoutAmount = payoutDetails.amount.toFixed(2); // Convert amount to two decimal places
    const payoutDate = payoutDetails.requestedOn.toLocaleDateString(); // Format the date

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
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
    });

    // Helper to move to next line
    function jumpLine(doc, lines) {
      for (let index = 0; index < lines; index++) {
        doc.moveDown();
      }
    }

    // doc.pipe(res);
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#fff");
    doc.fontSize(10);

    // Margin
    const distanceMargin = 18;

    doc
      .fillAndStroke("#0e8cc3")
      .lineWidth(20)
      .lineJoin("round")
      .rect(
        distanceMargin,
        distanceMargin,
        doc.page.width - distanceMargin * 2,
        doc.page.height - distanceMargin * 2
      )
      .stroke();

    // Header
    const maxWidth = 200;
    const maxHeight = 90;

    doc.image("assets/img/Logo.png", doc.page.width / 2 - maxWidth / 2, 50, {
      fit: [maxWidth, maxHeight],
      align: "center",
    });

    jumpLine(doc, 5);

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Super Course for Awesomes", {
        align: "center",
      });

    jumpLine(doc, 2);

    // Content
    doc
      .font("assets/fonts/NotoSansJP-Regular.otf")
      .fontSize(16)
      .fill("#021c27")
      .text("CERTIFICATE OF COMPLETION", {
        align: "center",
      });

    jumpLine(doc, 1);

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Present to", {
        align: "center",
      });

    jumpLine(doc, 2);

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(24)
      .fill("#021c27")
      .text(userName.toUpperCase(), {
        align: "center",
      });

    jumpLine(doc, 1);

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Successfully completed the Super Course for Awesomes.", {
        align: "center",
      });

    jumpLine(doc, 7);

    doc.lineWidth(1);

    // Signatures
    const lineSize = 174;
    const signatureHeight = 390;

    doc.fillAndStroke("#021c27");
    doc.strokeOpacity(0.2);

    const startLine1 = 128;
    const endLine1 = 128 + lineSize;
    doc
      .moveTo(startLine1, signatureHeight)
      .lineTo(endLine1, signatureHeight)
      .stroke();

    const startLine2 = endLine1 + 32;
    const endLine2 = startLine2 + lineSize;
    doc
      .moveTo(startLine2, signatureHeight)
      .lineTo(endLine2, signatureHeight)
      .stroke();

    const startLine3 = endLine2 + 32;
    const endLine3 = startLine3 + lineSize;
    doc
      .moveTo(startLine3, signatureHeight)
      .lineTo(endLine3, signatureHeight)
      .stroke();

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Ramees Mohd", startLine1, signatureHeight + 10, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Associate Professor", startLine1, signatureHeight + 25, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(10)
      .fill("#021c27")
      .text(
        userName.charAt(0).toUpperCase() + userName.slice(1),
        startLine2,
        signatureHeight + 10,
        {
          columns: 1,
          columnGap: 0,
          height: 40,
          width: lineSize,
          align: "center",
        }
      );

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Student", startLine2, signatureHeight + 25, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Bold.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Sanoob Thadiyam", startLine3, signatureHeight + 10, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    doc
      .font("assets/fonts/NotoSansJP-Light.otf")
      .fontSize(10)
      .fill("#021c27")
      .text("Director", startLine3, signatureHeight + 25, {
        columns: 1,
        columnGap: 0,
        height: 40,
        width: lineSize,
        align: "center",
      });

    jumpLine(doc, 4);

    // Generate PDF buffer
    const pdfBuffer = await new Promise((resolve, reject) => {
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.end(); // End the PDF generation
    });
    console.log(pdfBuffer);

    // Set response headers and send the PDF
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
