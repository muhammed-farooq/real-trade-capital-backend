// utils/email/emailTemplates.js

const emailTemplate = (body) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>Real Trade Capital</title>
    <style>
      :root { color-scheme: dark; supported-color-schemes: dark; }

      body, html {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img   { border: 0; outline: none; text-decoration: none; display: block; -ms-interpolation-mode: bicubic; }
      a     { color: #e74c3c; }

      /* ── iOS Mail dark mode overrides (data-ogsc) ───────────────── */
      /* These selectors are ONLY applied by iOS Mail in dark mode     */
      [data-ogsc] .logo-default   { display:none    !important; max-height:0 !important; overflow:hidden !important; }
      [data-ogsc] .logo-dark-mode { display:block   !important; max-height:none !important; max-width:none !important; height:34px !important; overflow:visible !important; }
      [data-ogsc] .email-card     { background-color:#0a0a0a !important; }
      [data-ogsc] .email-body     { background-color:#0a0a0a !important; }
      [data-ogsc] .email-header   { background-color:#0a0a0a !important; }

      /* ── Mobile ──────────────────────────────────────────────────── */
      @media only screen and (max-width: 620px) {
        .email-card   { width: 100% !important; border-radius: 0 !important; }
        .email-body   { padding: 0 16px 32px !important; }
        .email-header { padding: 16px !important; }
        .btn-cell     { padding: 0 !important; }
        .btn-link     {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
          padding: 14px 20px !important;
          font-size: 12px !important;
          letter-spacing: 1px !important;
          text-align: center !important;
        }
        h1 { font-size: 26px !important; }
      }
    </style>
  </head>

  <body style="margin:0;padding:0;background-color:#f0f0ee;">
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background-color:#f0f0ee;">
      <tbody>
        <tr>
          <td align="center" style="padding:32px 8px;">

            <!-- ── CARD ── -->
            <table class="email-card" cellspacing="0" cellpadding="0" align="center"
              style="border-collapse:collapse;width:600px;max-width:600px;background-color:#0a0a0a;border-radius:16px;overflow:hidden;">
              <tbody>

                <!-- TOP ACCENT LINE -->
                <tr>
                  <td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#c0392b 0%,#e74c3c 40%,#ff6b6b 70%,#c0392b 100%);border-radius:16px 16px 0 0;">&nbsp;</td>
                </tr>

                <!-- HEADER -->
                <tr>
                  <td class="email-header" style="padding:20px 28px;background-color:#0a0a0a;border-bottom:1px solid #1a1a1a;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td style="vertical-align:middle;">
                            <!--
                              iOS Mail light-mode proof logo swap.
                              iOS Mail uses [data-ogsc] and .ii a[href] overrides.
                              The u+0000 class trick forces iOS Mail to respect
                              the dark/light swap via [data-ogsc] selectors.
                              Black logo shown by default (safe for forced light bg).
                              White logo shown via [data-ogsc] when dark mode is active.
                            -->

                            <!-- BLACK logo: default, visible on white/light bg -->
                            <img
                              src="https://res.cloudinary.com/dj5inosqh/image/upload/v1773567906/white_logo_iszi95.png"
                              alt="Real Trade Capital"
                              height="34"
                              class="logo-default"
                              style="display:block;border:0;outline:none;height:34px;max-height:34px;"
                            />
                            <!-- WHITE logo: hidden by default, shown in dark mode via [data-ogsc] -->
                            <img
                              src="https://res.cloudinary.com/dj5inosqh/image/upload/v1773566701/black_logo_q0cvyn.png" 
                              alt=""
                              height="34"
                              class="logo-dark-mode"
                              style="display:none;border:0;outline:none;height:0;max-height:0;max-width:0;overflow:hidden;mso-hide:all;"
                            />
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-family:'Courier New',Courier,monospace;font-size:10px;color:#555555;letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">SECURE MAIL</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td class="email-body" style="padding:8px 28px 40px 28px;background-color:#0a0a0a;">
                    ${body}
                  </td>
                </tr>

                <!-- FOOTER DIVIDER -->
                <tr>
                  <td style="padding:0 28px;background-color:#0a0a0a;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td style="height:1px;font-size:0;line-height:0;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);">&nbsp;</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- FOOTER CONTENT -->
                <tr>
                  <td align="center" style="padding:24px 28px 28px;background-color:#0a0a0a;text-align:center;">
                    <p style="margin:0 0 10px 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#666666;letter-spacing:2px;text-transform:uppercase;text-align:center;">NEED ASSISTANCE?</p>
                    <p style="margin:0 0 20px 0;text-align:center;">
                      <a href="mailto:support@realtradecapital.com"
                        style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#e74c3c;text-decoration:none;letter-spacing:0.5px;border-bottom:1px solid #4a2020;padding-bottom:2px;">
                        support@realtradecapital.com
                      </a>
                    </p>
                    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#777777;line-height:22px;text-align:center;">
                      Kind regards,<br/>
                      <strong style="color:#cccccc;letter-spacing:0.5px;">Real Trade Capital Team</strong>
                    </p>
                  </td>
                </tr>

                <!-- BOTTOM ACCENT LINE -->
                <tr>
                  <td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#c0392b 0%,#e74c3c 40%,#ff6b6b 70%,#c0392b 100%);border-radius:0 0 16px 16px;">&nbsp;</td>
                </tr>

              </tbody>
            </table>

            <!-- Legal note -->
            <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;width:100%;max-width:600px;">
              <tbody>
                <tr>
                  <td align="center" style="padding:16px 24px;text-align:center;">
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#888888;letter-spacing:0.5px;text-align:center;line-height:20px;">
                      &copy; 2025 Real Trade Capital. All rights reserved.<br/>
                      This email was sent to you as a registered member of the Real Trade Capital platform.
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
`;

// ── badge ─────────────────────────────────────────────────────────────────────
const badge = (label, color = "#e74c3c") => `
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse;display:inline-table;">
    <tbody>
      <tr>
        <td style="padding:6px 16px;background:${color}22;border:1px solid ${color}66;">
          <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:${color};letter-spacing:2px;text-transform:uppercase;font-weight:700;">${label}</span>
        </td>
      </tr>
    </tbody>
  </table>
`;

// ── dashboardButton ───────────────────────────────────────────────────────────
const dashboardButton = (url) => `
  <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;margin-top:28px;width:100%;">
    <tbody>
      <tr>
        <td class="btn-cell" align="center">
          <a href="${url}" target="_blank" class="btn-link"
            style="display:inline-block;background:linear-gradient(135deg,#c0392b,#e74c3c);color:#ffffff;font-family:'Courier New',Courier,monospace;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-decoration:none;padding:15px 40px;border-radius:4px;mso-padding-alt:15px 40px;">
            Access Dashboard &rarr;
          </a>
        </td>
      </tr>
    </tbody>
  </table>
`;

// ── divider ───────────────────────────────────────────────────────────────────
const divider = () => `
  <tr>
    <td style="padding:28px 0;">
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
        <tbody>
          <tr>
            <td style="height:1px;font-size:0;line-height:0;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);">&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </td>
  </tr>
`;

// ── statRow ───────────────────────────────────────────────────────────────────
const statRow = (label, value) => `
  <tr>
    <td style="padding:12px 16px;border-bottom:1px solid #1a1a1a;">
      <p style="margin:0 0 5px 0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#666666;letter-spacing:2px;text-transform:uppercase;">${label}</p>
      <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:13px;color:#e0e0e0;font-weight:600;line-height:1.4;">${value}</p>
    </td>
  </tr>
`;

module.exports = { emailTemplate, badge, dashboardButton, divider, statRow };