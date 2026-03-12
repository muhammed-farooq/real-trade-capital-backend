const { emailTemplate } = require("./emailTemplates");

const badge = (label, color = "#e74c3c") => `
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;display:inline-table;">
    <tbody>
      <tr>
        <td style="padding:5px 14px;background:${color}18;border:1px solid ${color}44;border-radius:20px;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${color};letter-spacing:2px;text-transform:uppercase;font-weight:600;">${label}</span>
        </td>
      </tr>
    </tbody>
  </table>
`;
 
const dashboardButton = (url) => `
  <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin-top:32px;">
    <tbody>
      <tr>
        <td align="center">
          <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:4px;border:none;">
            Access Dashboard →
          </a>
        </td>
      </tr>
    </tbody>
  </table>
`;
 
const divider = () => `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:32px 0;">
    <tbody>
      <tr>
        <td style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></td>
      </tr>
    </tbody>
  </table>
`;
 
const statRow = (label, value) => `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#555;letter-spacing:2px;text-transform:uppercase;">${label}</td>
            <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#e0e0e0;font-weight:600;">${value}</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
`;
 
/* ─── ORDER APPROVE ──────────────────────────────────────── */
 
const orderApprove = (userName) =>
  emailTemplate(`
    <!-- Status badge -->
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;padding-top:40px;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Phase 1 Activated", "#22c55e")}
          </td>
        </tr>
 
        <!-- Hero heading -->
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Welcome to the<br/><span style="color:#e74c3c;">First Phase.</span></h1>
          </td>
        </tr>
 
        <!-- Greeting -->
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#888;letter-spacing:1px;">Hi, <strong style="color:#ccc;">${userName}</strong></p>
          </td>
        </tr>
 
        ${divider()}
 
        <!-- Body text -->
        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Your trading challenge has officially been activated. You are now entering the <strong style="color:#fff;">First Phase</strong> — the first milestone on your path to becoming a funded trader with Real Trade Capital.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding-bottom:24px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Your account credentials are now live in your dashboard. Review the trading rules carefully to ensure full compliance throughout your challenge.
            </p>
          </td>
        </tr>
 
        <!-- Info card -->
        <tr>
          <td style="padding-top:8px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1e1e1e;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#111;padding:14px 16px;border-bottom:1px solid #1a1a1a;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#555;letter-spacing:3px;text-transform:uppercase;">Account Info</span>
                  </td>
                </tr>
                ${statRow("Status", "&#9679; Active")}
                ${statRow("Phase", "01 / Challenge Phase 1")}
                ${statRow("Credentials", "Updated in Dashboard")}
              </tbody>
            </table>
          </td>
        </tr>
 
        <!-- CTA -->
        <tr>
          <td align="center">
            ${dashboardButton(`${process.env.API_URL}/dashboard`)}
          </td>
        </tr>
 
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Best of luck, ${userName}. Trade well.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);
 
/* ─── ORDER CANCELLED ────────────────────────────────────── */
 
const orderCancelled = (userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Order Unsuccessful", "#f59e0b")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">Unable to Process<br/><span style="color:#f59e0b;">Your Challenge.</span></h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#888;letter-spacing:1px;">Hi, <strong style="color:#ccc;">${userName}</strong></p>
          </td>
        </tr>
 
        ${divider()}
 
        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Thank you for your interest in a Real Trade Capital challenge. Unfortunately, we were unable to process your challenge request at this time.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              If you believe this is an error or would like to discuss further, our support team is ready to assist you.
            </p>
          </td>
        </tr>
 
        <!-- Info card -->
        <tr>
          <td style="padding-top:32px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #2a1a00;border-radius:8px;overflow:hidden;background:#111008;">
              <tbody>
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#f59e0b;letter-spacing:1px;line-height:22px;">
                      → Contact us at <a href="mailto:support@realtradecapital.com" style="color:#f59e0b;">support@realtradecapital.com</a><br/>
                      → Reference your account name when reaching out<br/>
                      → Our team responds within 24 hours
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
 
        <tr>
          <td align="center" style="padding-top:32px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">We look forward to supporting you.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);
 
module.exports = {
  orderApprove,
  orderCancelled,
};
