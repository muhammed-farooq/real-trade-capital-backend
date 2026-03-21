const { emailTemplate } = require("./emailTemplates");

/* ─── SHARED HELPERS ─────────────────────────────────────── */

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

const ctaButton = (url, label, color = "#e74c3c") => `
  <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin-top:32px;">
    <tbody>
      <tr>
        <td align="center">
          <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,${color === "#e74c3c" ? "#c0392b,#e74c3c" : color + "cc," + color});color:#fff;font-family:'Courier New',Courier,monospace;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:16px 40px;border-radius:4px;">
            ${label} →
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

/* ─── EMAIL VERIFICATION ─────────────────────────────────── */

const verification = (verificationLink, userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Email Verification", "#6366f1")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Confirm Your<br/><span style="color:#6366f1;">Email.</span></h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#888;letter-spacing:1px;">Welcome, <strong style="color:#ccc;">${userName}</strong></p>
          </td>
        </tr>

        ${divider()}

        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Thank you for creating your <strong style="color:#fff;">Real Trade Capital</strong> account. Please confirm your email address to complete your registration.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Click the button below to confirm. This link will expire in 24 hours.
            </p>
          </td>
        </tr>

        <!-- Security card -->
        <tr>
          <td style="padding-top:28px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#0d0d1a;border:1px solid #1e1e3a;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#6366f1;letter-spacing:2px;text-transform:uppercase;">Security Notice</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → This link expires in 24 hours<br/>
                      → Do not share this email with others<br/>
                      → If you did not sign up, you can safely ignore this
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center">
            ${ctaButton(verificationLink, "Confirm Email", "#6366f1")}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">One click to get started.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

/* ─── FORGOT PASSWORD ────────────────────────────────────── */

const forgotMail = (verificationLink, userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Password Reset", "#f59e0b")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Reset Your<br/><span style="color:#f59e0b;">Password.</span></h1>
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
              We received a request to reset the password for your <strong style="color:#fff;">Real Trade Capital</strong> account. Click the button below to create a new password.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              If you did not request a password reset, you can safely ignore this email — your account remains secure.
            </p>
          </td>
        </tr>

        <!-- Security card -->
        <tr>
          <td style="padding-top:28px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#111008;border:1px solid #2a1a00;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b;letter-spacing:2px;text-transform:uppercase;">Security Notice</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → This reset link expires in 1 hour<br/>
                      → Never share this link with anyone<br/>
                      → Contact support if you did not request this
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center">
            ${ctaButton(verificationLink, "Set New Password", "#f59e0b")}
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Your account security is our priority.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

/* ─── PURCHASE CONFIRMATION (User) ──────────────────────── */

const purchaseConfirmation = (userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Order Received", "#22c55e")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Challenge<br/><span style="color:#22c55e;">Purchased.</span></h1>
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
              Thank you for purchasing a challenge with <strong style="color:#fff;">Real Trade Capital</strong>. We are now processing your order and setting up your trading account.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              You will receive a follow-up email with your full account credentials as soon as it's ready. Sit tight — your journey begins very soon.
            </p>
          </td>
        </tr>

        <!-- Status card -->
        <tr>
          <td style="padding-top:28px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1a2a1a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#0a120a;padding:14px 16px;border-bottom:1px solid #1a2a1a;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#22c55e;letter-spacing:3px;text-transform:uppercase;">Order Status</span>
                  </td>
                </tr>
                ${statRow("Purchase", "&#10003; Confirmed", "#22c55e")}
                ${statRow("Processing", "&#9654; In Progress")}
                ${statRow("Account Credentials", "Pending — Check Email")}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- What to expect -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#0a120a;border:1px solid #1a2a1a;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#22c55e;letter-spacing:2px;text-transform:uppercase;">What Happens Next</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → Your challenge account is being set up<br/>
                      → You'll receive credentials by email once ready<br/>
                      → Review the trading rules in your dashboard<br/>
                      → Contact support if you have questions
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        <tr>
          <td align="center" style="padding-top:32px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Your trading journey starts here.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

/* ─── PURCHASE CONFIRMATION (Admin) ─────────────────────── */

const purchaseConfirmationAdmin = (userName) =>
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
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">New Challenge<br/><span style="color:#6366f1;">Purchase Received.</span></h1>
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
              A new challenge has been purchased by <strong style="color:#fff;">${userName}</strong>. Please initiate the processing of the challenge and prepare the trading account credentials for this order.
            </p>
          </td>
        </tr>

        <!-- Order card -->
        <tr>
          <td style="padding-top:28px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1e1e3a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#0d0d1a;padding:14px 16px;border-bottom:1px solid #1a1a2e;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#6366f1;letter-spacing:3px;text-transform:uppercase;">Order Details</span>
                  </td>
                </tr>
                ${statRow("Customer", userName)}
                ${statRow("Product", "Trading Challenge")}
                ${statRow("Action Required", "&#9650; Setup Account", "#6366f1")}
              </tbody>
            </table>
          </td>
        </tr>

        <!-- Checklist -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#0d0d1a;border:1px solid #1a1a2e;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 12px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#6366f1;letter-spacing:2px;text-transform:uppercase;">Admin Checklist</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → Confirm the purchase in the admin panel<br/>
                      → Create and configure the trading account<br/>
                      → Send credentials to ${userName}<br/>
                      → Mark the order as processed
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

module.exports = {
  verification,
  forgotMail,
  purchaseConfirmation,
  purchaseConfirmationAdmin,
};