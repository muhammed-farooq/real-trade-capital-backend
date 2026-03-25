/**
 * certificateGenerator.js — v9 QR FRAME PRECISION
 */

const path = require("path");
const sharp = require("sharp");
const QRCode = require("qrcode");

const TEMPLATE_PATH = path.join(__dirname, "../assets/certificate_template.png");

// ── COORDINATES (Adjusted for the visual center of the gold box) ──────────
const LEFT_MARGIN = 210;       
const NAME_Y = 940;            
const DATE_Y = 1765;           

// These values are nudged to account for the thickness of the gold border
const QR_BOX_X = 1568;         // Nudged right
const QR_BOX_Y = 848;          // Nudged down
const QR_SIZE = 355;           // Slightly reduced size to allow more "white space" inside the gold frame
// ─────────────────────────────────────────────────────────────────────────────

const escapeXml = (unsafe) => {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;'; case '>': return '&gt;';
      case '&': return '&amp;'; case '"': return '&quot;';
      case "'": return '&apos;'; default: return c;
    }
  });
};

const generateQR = async (text) => {
  const raw = await QRCode.toBuffer(text, {
    margin: 1, 
    width: 600,
    color: {
      dark: "#000000",
      light: "#ffffff00", // Transparent background
    },
  });
  return sharp(raw).resize(QR_SIZE, QR_SIZE).toBuffer();
};

const buildTextSVG = ({ name, date }) => {
  const escapedName = escapeXml(name.toUpperCase());
  const escapedDate = escapeXml(date);

  let fontSize = 115;
  if (name.length > 18) fontSize = 90;

  const svg = `
    <svg width="2048" height="2048" xmlns="http://www.w3.org/2000/svg">
      <style>
        /* Using a system serif that mimics the classy look without external loading */
        .name { font-family: 'Georgia', serif; font-size: ${fontSize}px; font-weight: 900; fill: #8B1A1A; }
        .date { font-family: 'Arial', sans-serif; font-size: 55px; font-weight: 700; fill: #333333; }
      </style>
      <text x="${LEFT_MARGIN}" y="${NAME_Y}" class="name" text-anchor="start">${escapedName}</text>
      <text x="${LEFT_MARGIN}" y="${DATE_Y}" class="date" text-anchor="start">${escapedDate}</text>
    </svg>`;
  return Buffer.from(svg);
};

const generateCertificate = async ({ name, issuedOn, accountId, verifyUrl }) => {
  try {
    const dateObj = new Date(issuedOn);
    const dateStr = `${dateObj.toLocaleString('en-US', { month: 'short' })} ${dateObj.getDate()} ${dateObj.getFullYear()}`; 

    const url = verifyUrl || `https://realtradecapital.com/certificate/${accountId}`;
    
    const [qrBuffer, svgBuffer] = await Promise.all([
      generateQR(url),
      buildTextSVG({ name, date: dateStr })
    ]);

    return await sharp(TEMPLATE_PATH)
      .composite([
        { input: svgBuffer, top: 0, left: 0 },
        { input: qrBuffer, top: QR_BOX_Y, left: QR_BOX_X }
      ])
      .png()
      .toBuffer();
  } catch (err) {
    console.error("Certificate Generation Error:", err);
    throw err;
  }
};

module.exports = { generateCertificate };