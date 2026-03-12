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
 
const toNext = (account) =>
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
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">Phase Upgrade<br/><span style="color:#6366f1;">Request Submitted.</span></h1>
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
              A new phase upgrade request has been submitted and requires your review. Please process the account below and advance the user to the next step of their trading challenge.
            </p>
          </td>
        </tr>
 
        <!-- Account card -->
        <tr>
          <td style="padding-top:28px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1e1e3a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#0d0d1a;padding:14px 16px;border-bottom:1px solid #1a1a2e;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#6366f1;letter-spacing:3px;text-transform:uppercase;">Request Details</span>
                  </td>
                </tr>
                ${statRow("Account ID", account)}
                ${statRow("Action Required", "Phase Upgrade")}
                ${statRow("Priority", "&#9650; Standard")}
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
 
/* ─── ACCOUNT PHASE TWO ──────────────────────────────────── */
 
const accountPhaseTwo = (account, userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Phase 2 Unlocked", "#22c55e")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">Phase One<br/><span style="color:#22c55e;">Conquered.</span></h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#888;letter-spacing:1px;">Congratulations, <strong style="color:#ccc;">${userName}</strong></p>
          </td>
        </tr>
 
        ${divider()}
 
        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Outstanding work. You have successfully completed Phase One of your challenge. Account <strong style="color:#fff;font-family:'Courier New',Courier,monospace;">${account}</strong> has now been advanced to the <strong style="color:#22c55e;">Second Phase</strong>.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Continue to trade with discipline. Review the Phase 2 rules and objectives in your dashboard to stay compliant and maximise your performance.
            </p>
          </td>
        </tr>
 
        <!-- Progress visual -->
        <tr>
          <td style="padding-top:32px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #1a2a1a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#0a120a;padding:20px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td style="width:33%;text-align:center;padding:8px;">
                            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#22c55e;letter-spacing:2px;">PHASE 1</p>
                            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#22c55e;">&#10003; Complete</p>
                          </td>
                          <td style="width:33%;text-align:center;padding:8px;border-left:1px solid #1a2a1a;border-right:1px solid #1a2a1a;">
                            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#e74c3c;letter-spacing:2px;">PHASE 2</p>
                            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#e74c3c;">&#9654; Active</p>
                          </td>
                          <td style="width:33%;text-align:center;padding:8px;">
                            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#333;letter-spacing:2px;">FUNDED</p>
                            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#333;">&#9675; Locked</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <!-- Progress bar -->
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-top:16px;">
                      <tbody>
                        <tr>
                          <td style="background:#1a2a1a;border-radius:4px;height:6px;overflow:hidden;">
                            <table width="66%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                              <tbody>
                                <tr>
                                  <td style="height:6px;background:linear-gradient(90deg,#22c55e,#e74c3c);border-radius:4px;"></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
 
        <tr>
          <td align="center">
            ${dashboardButton(`${process.env.API_URL}/dashboard`)}
          </td>
        </tr>
 
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">One phase closer. Keep going.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);
 
/* ─── ACCOUNT FUNDED ─────────────────────────────────────── */
 
const accountFunded = (account, userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <!-- Gold accent top -->
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Funded Trader Status", "#f59e0b")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.1;">You Are Now<br/><span style="background:linear-gradient(135deg,#f59e0b,#fcd34d);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Fully Funded.</span></h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:20px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:14px;color:#888;letter-spacing:1px;">Congratulations, <strong style="color:#ccc;">${userName}</strong></p>
          </td>
        </tr>
 
        ${divider()}
 
        <tr>
          <td style="padding-bottom:16px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              You've done it. Account <strong style="color:#fff;font-family:'Courier New',Courier,monospace;">${account}</strong> has successfully passed all challenge phases and has been elevated to <strong style="color:#f59e0b;">Funded Trader</strong> status.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              This is a significant achievement. Review your funded account rules in the dashboard and continue trading with the same precision that got you here.
            </p>
          </td>
        </tr>
 
        <!-- Funded card -->
        <tr>
          <td style="padding-top:32px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #2a1f00;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:linear-gradient(135deg,#1a1200,#120d00);padding:14px 16px;border-bottom:1px solid #2a1a00;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b;letter-spacing:3px;text-transform:uppercase;">Account Status</span>
                  </td>
                </tr>
                ${statRow("Account", account)}
                ${statRow("Stage", "&#11088; Funded")}
                ${statRow("All Phases", "&#10003; Completed")}
                ${statRow("Next Step", "Check Dashboard")}
              </tbody>
            </table>
          </td>
        </tr>
 
        <!-- Progress visual (all complete) -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;padding:16px;background:#0f0c00;border-radius:8px;border:1px solid #2a1a00;">
              <tbody>
                <tr>
                  <td style="padding:16px;">
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin-bottom:16px;">
                      <tbody>
                        <tr>
                          <td style="width:33%;text-align:center;">
                            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#f59e0b;letter-spacing:2px;">PHASE 1</p>
                            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b;">&#10003; Done</p>
                          </td>
                          <td style="width:33%;text-align:center;border-left:1px solid #2a1a00;border-right:1px solid #2a1a00;">
                            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#f59e0b;letter-spacing:2px;">PHASE 2</p>
                            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b;">&#10003; Done</p>
                          </td>
                          <td style="width:33%;text-align:center;">
                            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:10px;color:#fcd34d;letter-spacing:2px;">FUNDED</p>
                            <p style="margin:4px 0 0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#fcd34d;">&#11088; Active</p>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <!-- Full progress bar -->
                    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                      <tbody>
                        <tr>
                          <td style="background:#2a1a00;border-radius:4px;height:6px;">
                            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                              <tbody>
                                <tr>
                                  <td style="height:6px;background:linear-gradient(90deg,#f59e0b,#fcd34d);border-radius:4px;"></td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
 
        <tr>
          <td align="center">
            ${dashboardButton(`${process.env.API_URL}/dashboard`)}
          </td>
        </tr>
 
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#f59e0b55;letter-spacing:2px;text-transform:uppercase;">Welcome to the funded tier.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);
 
/* ─── ACCOUNT FAILED ─────────────────────────────────────── */
 
const accountFailed = (account, userName) =>
  emailTemplate(`
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
      <tbody>
        <tr>
          <td align="center" style="padding-top:40px;">
            ${badge("Rule Breach Detected", "#e74c3c")}
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:24px;padding-bottom:4px;">
            <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">Trading Rule<br/><span style="color:#e74c3c;">Violation Detected.</span></h1>
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
              We regret to inform you that account <strong style="color:#fff;font-family:'Courier New',Courier,monospace;">${account}</strong> has triggered a breach of one of our program's trading regulations.
            </p>
          </td>
        </tr>
        <tr>
          <td>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;color:#aaa;line-height:28px;">
              Please log in to your dashboard immediately to review the violation alert and understand the specific rule that was breached.
            </p>
          </td>
        </tr>
 
        <!-- Alert card -->
        <tr>
          <td style="padding-top:32px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #3a0a0a;border-radius:8px;overflow:hidden;">
              <tbody>
                <tr>
                  <td style="background:#150505;padding:14px 20px;border-bottom:1px solid #2a0a0a;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#e74c3c;letter-spacing:3px;text-transform:uppercase;">&#9888; Violation Report</span>
                  </td>
                </tr>
                ${statRow("Account", account)}
                ${statRow("Status", "&#9888; Breached")}
                ${statRow("Details", "View in Dashboard")}
              </tbody>
            </table>
          </td>
        </tr>
 
        <!-- What to do next -->
        <tr>
          <td style="padding-top:24px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#0d0505;border:1px solid #2a0a0a;border-radius:8px;">
              <tbody>
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 10px;font-family:'Courier New',Courier,monospace;font-size:11px;color:#e74c3c;letter-spacing:2px;text-transform:uppercase;">Next Steps</p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;color:#888;letter-spacing:1px;line-height:24px;">
                      → Log in and review your dashboard alerts<br/>
                      → Identify the rule that was breached<br/>
                      → Contact support if you have questions<br/>
                      → Consider a new challenge to continue your journey
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
 
        <tr>
          <td align="center">
            ${dashboardButton(`${process.env.API_URL}/dashboard`)}
          </td>
        </tr>
 
        <tr>
          <td align="center" style="padding-top:24px;">
            <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:11px;color:#444;letter-spacing:2px;text-transform:uppercase;">Every setback is a setup for a comeback.</p>
          </td>
        </tr>
      </tbody>
    </table>
  `);

module.exports = {
  toNext,
  accountPhaseTwo,
  accountFunded,
  accountFailed,
};
