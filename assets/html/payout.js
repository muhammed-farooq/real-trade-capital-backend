const { emailTemplate } = require("./emailTemplates");

/* ─── SHARED HELPERS (mirrors emailBodies.js) ────────────── */

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

const payoutsButton = (url) => `
  <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin-top:32px;">
    <tbody>
      <tr>
        <td align="center">
          <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#fff;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:4px;">
            View Payouts →
          </a>
        </td>
      </tr>
    </tbody>
  </table>
`;

const divider = () => `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:32px 0;">
    <tbody><tr>
      <td style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></td>
    </tr></tbody>
  </table>
`;

const statRow = (label, value, valueColor = "#e0e0e0") => `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tbody><tr>
          <td style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#555;letter-spacing:2px;text-transform:uppercase;">${label}</td>
          <td align="right" style="font-family:'Courier New',Courier,monospace;font-size:13px;color:${valueColor};font-weight:600;">${value}</td>
        </tr></tbody>
      </table>
    </td>
  </tr>
`;

/* ─── WITHDRAWAL REQUEST (Admin Notification) ────────────── */

const withdrawalRequest = (userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Admin Alert", "#6366f1")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">New Payout<br/><span style="color:#6366f1;">Request Submitted.</span></h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:16px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#888;letter-spacing:1px;">Hi, <strong style="color:#ccc;">Admin</strong></p>
          </td>
        </tr>

        ${divider()}

        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              A new payout request has been submitted by <strong style="color:#fff;">${userName}</strong>. Please review and process it as soon as possible.
            </p>
          </td>
        </tr>

        <!-- Request card -->
        <tr>
          <td style="padding-top:28px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1e1e3a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#0d0d1a;padding:14px 16px;border-bottom:1px solid #1a1a2e;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#6366f1;letter-spacing:3px;text-transform:uppercase;">Request Details</span>
                  </td>
                </tr>
                ${statRow("Submitted by", userName)}
                ${statRow("Type", "Payout Request")}
                ${statRow("Action Required", "&#9650; Review &amp; Process", "#6366f1")}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Reminder -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#0d0d1a;border:1px solid #1a1a2e;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → Log in to the admin panel to review this request<br/>
                      → Verify payout details before approving<br/>
                      → Notify the trader once processed
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:32px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Action required in the admin panel.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

/* ─── WITHDRAWAL APPROVE ─────────────────────────────────── */

const withdrawalApprove = (userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Payout Approved", "#22c55e")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Your Payout<br/><span style="color:#22c55e;">Is On Its Way.</span></h1>
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
              Your payout request has been <strong style="color:#22c55e;">approved</strong>. The funds will be processed and transferred to your designated account shortly.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Thank you for trading with Real Trade Capital. We look forward to your continued success.
            </p>
          </td>
        </tr>

        <!-- Status card -->
        <tr>
          <td style="padding-top:32px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1a2a1a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#0a120a;padding:14px 16px;border-bottom:1px solid #1a2a1a;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#22c55e;letter-spacing:3px;text-transform:uppercase;">Payout Status</span>
                  </td>
                </tr>
                ${statRow("Status", "&#10003; Approved", "#22c55e")}
                ${statRow("Processing", "In Progress")}
                ${statRow("Destination", "Designated Account")}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Timeline -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#0a120a;border:1px solid #1a2a1a;border-radius:8px;padding:20px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#22c55e;letter-spacing:2px;text-transform:uppercase;">What Happens Next</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → Funds are being processed now<br/>
                      → Transfer will be sent to your designated account<br/>
                      → Check your Payouts section for live status updates<br/>
                      → Contact support if funds have not arrived within 3–5 business days
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center">
            ${payoutsButton(`${process.env.API_URL}/dashboard/payouts`)}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Keep trading. Keep growing.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

/* ─── WITHDRAWAL REJECT ──────────────────────────────────── */

const withdrawalReject = (userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Payout Not Processed", "#f59e0b")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">Payout Request<br/><span style="color:#f59e0b;">Not Approved.</span></h1>
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
              We regret to inform you that your recent payout request has <strong style="color:#f59e0b;">not been approved</strong> at this time.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Full details regarding this decision are available in your Payouts section. If you believe this is an error or need clarification, our support team is here to help.
            </p>
          </td>
        </tr>

        <!-- Status card -->
        <tr>
          <td style="padding-top:32px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #2a1f00;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#111008;padding:14px 16px;border-bottom:1px solid #2a1a00;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b;letter-spacing:3px;text-transform:uppercase;">Request Status</span>
                  </td>
                </tr>
                ${statRow("Status", "&#10005; Not Approved", "#f59e0b")}
                ${statRow("Details", "Available in Dashboard")}
                ${statRow("Next Step", "Review or Contact Support")}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Next steps -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#111008;border:1px solid #2a1a00;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;">What To Do Next</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → Visit your Payouts section for full rejection details<br/>
                      → Ensure all payout requirements have been met<br/>
                      → Reach out to support@realtradecapital.com for assistance<br/>
                      → Resubmit once any outstanding issues are resolved
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center">
            ${payoutsButton(`${process.env.API_URL}/dashboard/payouts`)}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">We appreciate your continued partnership.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

module.exports = {
  withdrawalRequest,
  withdrawalApprove,
  withdrawalReject,
};