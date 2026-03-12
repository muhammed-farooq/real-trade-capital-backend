const emailTemplate = (body) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Real Trade Capital</title>
    <style>
      body, html { margin:0; padding:0; background:#f0f0ee; }
      body { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
      table { border-collapse:collapse; mso-table-lspace:0pt; mso-table-rspace:0pt; }
      img { border:0; outline:none; text-decoration:none; display:block; }
      a { color:#e74c3c; }
    </style>
  </head>

  <body style="margin:0;padding:0;background-color:#f0f0ee;">

    <!-- Outer wrapper -->
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background-color:#f0f0ee;">
      <tbody>
        <tr>
          <td align="center" style="padding:40px 16px 40px 16px;">

            <!--
              SINGLE CARD TABLE — header + body + footer all in ONE table
              so border-radius applies cleanly with no gaps between sections
            -->
            <table cellspacing="0" cellpadding="0" align="center"
              style="border-collapse:collapse;width:600px;max-width:600px;background-color:#0a0a0a;border-radius:16px;overflow:hidden;">
              <tbody>

                <!-- TOP ACCENT LINE -->
                <tr>
                  <td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#c0392b 0%,#e74c3c 40%,#ff6b6b 70%,#c0392b 100%);border-radius:16px 16px 0 0;">&nbsp;</td>
                </tr>

                <!-- HEADER -->
                <tr>
                  <td style="padding:24px 32px;background-color:#0a0a0a;border-bottom:1px solid #111111;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td style="vertical-align:middle;">
                            <img
                              src="https://res.cloudinary.com/dqtevw6ky/image/upload/v1773089478/Untitled_design_4_kndo6h.png"
                              alt="Real Trade Capital"
                              height="44"
                              style="display:block;border:0;outline:none;height:44px;"
                            />
                          </td>
                          <td align="right" style="vertical-align:middle;">
                            <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#555555;letter-spacing:3px;text-transform:uppercase;">SECURE MAIL</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- BODY -->
                <tr>
                  <td style="padding:0 32px 40px 32px;background-color:#0a0a0a;">
                    ${body}
                  </td>
                </tr>

                <!-- FOOTER DIVIDER -->
                <tr>
                  <td style="padding:0 32px;background-color:#0a0a0a;">
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
                  <td style="padding:28px 32px 32px 32px;background-color:#0a0a0a;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td align="center" style="padding-bottom:10px;">
                            <span style="font-family:'Courier New',Courier,monospace;font-size:13px;color:#555555;letter-spacing:2px;text-transform:uppercase;">NEED ASSISTANCE?</span>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding-bottom:24px;">
                            <a href="mailto:support@realtradecapital.com"
                              style="font-family:'Courier New',Courier,monospace;font-size:14px;color:#e74c3c;text-decoration:none;letter-spacing:1px;border-bottom:1px solid #3a1a1a;padding-bottom:2px;">
                              support@realtradecapital.com
                            </a>
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:13px;color:#444444;line-height:22px;">
                              Kind regards,<br/>
                              <strong style="color:#cccccc;letter-spacing:1px;">Real Trade Capital Team</strong>
                            </p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- BOTTOM ACCENT LINE -->
                <tr>
                  <td style="height:3px;font-size:0;line-height:0;background:linear-gradient(90deg,#c0392b 0%,#e74c3c 40%,#ff6b6b 70%,#c0392b 100%);border-radius:0 0 16px 16px;">&nbsp;</td>
                </tr>

              </tbody>
            </table>

            <!-- Legal note outside the card -->
            <table cellspacing="0" cellpadding="0" align="center" style="border-collapse:collapse;width:600px;max-width:600px;">
              <tbody>
                <tr>
                  <td align="center" style="padding:20px 32px;">
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#999999;letter-spacing:1px;text-align:center;line-height:18px;">
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

module.exports = { emailTemplate };