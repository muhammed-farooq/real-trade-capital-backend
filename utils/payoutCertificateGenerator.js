/**
 * payoutCertificateGenerator.js (FINAL ALIGNED VERSION)
 */

const path   = require("path");
const sharp  = require("sharp");
const QRCode = require("qrcode");

// ── Template ─────────────────────────────────────────────────────
const TEMPLATE_PATH = path.join(__dirname, "../assets/payout_certificate_template.png");

// ── PERFECT ALIGNMENT (2048x2048) ────────────────────────────────
const LEFT_MARGIN = 170;

const NAME_Y   = 990;    // ↑ move up slightly
const AMOUNT_Y = 1400;   // ↑ tighter under "Your Reward"
const DATE_Y   = 1765;   // ↑ sits exactly on gold line

// QR positioning (centered inside frame)
const QR_SIZE = 315; // was 300
const QR_FRAME_X     = 1568;
const QR_FRAME_Y     = 1115;
const QR_FRAME_SIZE  = 360;

// QR (micro-adjust)
const QR_BOX_X = 1538;  // move slightly left
const QR_BOX_Y = 1205;  // move slightly up 

// ── Helpers ─────────────────────────────────────────────────────
const escapeXml = (str) =>
  String(str).replace(/[<>&"']/g, (c) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;",
  }[c]));

const formatDate = (d) => {
  const dt = new Date(d);
  return `${dt.getDate()} ${dt.toLocaleString("en-US", { month: "short" })} ${dt.getFullYear()}`;
};

// ── QR Code ─────────────────────────────────────────────────────
const generateQR = async (text) => {
  const raw = await QRCode.toBuffer(text, {
    margin: 1,
    width:  600,
    color:  { dark: "#000000", light: "#ffffff00" },
  });

  return sharp(raw).resize(QR_SIZE, QR_SIZE).toBuffer();
};


// ── SVG TEXT LAYER ──────────────────────────────────────────────
const buildTextSvg = ({
  name,
  formattedAmount,
  formattedDate,
  templateWidth,
  templateHeight
}) => {

  const escapedName   = escapeXml(name.toUpperCase());
  const escapedAmount = escapeXml(`$${formattedAmount}`);
  const escapedDate   = escapeXml(formattedDate);

  // 🔥 Better font scaling
  let nameFontSize = 100;
  if (name.length > 18) nameFontSize = 85;
  if (name.length > 24) nameFontSize = 70;
  if (name.length > 32) nameFontSize = 58;

  return Buffer.from(`
    <svg width="${templateWidth}" height="${templateHeight}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .amount {
          font-family: 'Helvetica Neue', 'Arial', sans-serif;
          font-size: 205px;
          font-weight: 700;
          fill: #9E1B1B;
          letter-spacing: 2px;
        }

        .date {
          font-family: 'Arial', sans-serif;
          font-size: 58px;
          font-weight: 600;
          fill: #333333;
        }

        .name {
          font-family: 'Georgia', serif;
          font-size: ${nameFontSize}px;
          font-weight: 700;
          fill: #B8960C;
          letter-spacing: 8px;
        }
        
        text {
          shape-rendering: geometricPrecision;
        }
      </style>

      <!-- NAME (Perfect center + optical alignment) -->
      <text x="${templateWidth / 2}" y="${NAME_Y}"
            class="name"
            text-anchor="middle"
            dominant-baseline="middle">
        ${escapedName}
      </text>

      <!-- AMOUNT -->
      <text x="${LEFT_MARGIN}" y="${AMOUNT_Y}"
            class="amount"
            text-anchor="start"
            dominant-baseline="middle">
        ${escapedAmount}
      </text>

      <!-- DATE -->
      <text x="${LEFT_MARGIN}" y="${DATE_Y}"
            class="date"
            text-anchor="start"
            dominant-baseline="middle">
        ${escapedDate}
      </text>

    </svg>
  `);
};


// ── MAIN FUNCTION ───────────────────────────────────────────────
const generatePayoutCertificatePng = async ({
  name,
  amount,
  issuedOn,
  verifyUrl
}) => {

  const meta = await sharp(TEMPLATE_PATH).metadata();
  const templateWidth  = meta.width;
  const templateHeight = meta.height;

  const formattedAmount = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedDate = formatDate(issuedOn);

  const url = verifyUrl || `https://realtradecapital.com/certificate/payout/verify`;

  const [qrBuffer, svgBuffer] = await Promise.all([
    generateQR(url),
    Promise.resolve(
      buildTextSvg({
        name,
        formattedAmount,
        formattedDate,
        templateWidth,
        templateHeight
      })
    )
  ]);

  return sharp(TEMPLATE_PATH)
    .composite([
      { input: svgBuffer, top: 0, left: 0 },
      { input: qrBuffer,  top: QR_BOX_Y, left: QR_BOX_X }
    ])
    .png()
    .toBuffer();
};


// ── EXPORT ─────────────────────────────────────────────────────
module.exports = {
  generatePayoutCertificatePng
};