// jobs/utils/accountLifecycle.js

const TradingAccount = require("../../../models/dashboard/tradingAccount");
const Account        = require("../../../models/account");
const User           = require("../../../models/user");
const { Resend }     = require("resend");
const { breachEmail, passEmail } = require("../../../assets/html/account");
const resend  = new Resend(process.env.RESEND_SECRET_KEY);

const clearCredentials = async (accountDoc) => {
  const blank = {  password: "" };
  accountDoc.PhaseOneCredentials    = { ...blank };
  accountDoc.PhaseTwoCredentials    = { ...blank };
  accountDoc.FundedStageCredentials = { ...blank };
};

const breachAccount = async (tradingAccountId, reason) => {
  try {
    // ── 1. Fail the TradingAccount ────────────────────────────────────────────
    const tradingAcc = await TradingAccount.findByIdAndUpdate(
      tradingAccountId,
      {
        $set: {
          status:    "failed",
          syncError: reason,
          lastSync:  new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!tradingAcc) {
      console.error(`[breachAccount] TradingAccount ${tradingAccountId} not found`);
      return;
    }

    // ── 2. Mark challenge Account as Not Passed + clear credentials ───────────
    const accountDoc = await Account.findById(tradingAcc.account);
    if (accountDoc) {
      accountDoc.status   = "Not Passed";
      accountDoc.failedOn = new Date();
      await clearCredentials(accountDoc);
      await accountDoc.save();
    }

    console.warn(`[breachAccount] ${tradingAccountId} → failed | Account → Not Passed | reason: ${reason}`);

    // ── 3. Email the user ─────────────────────────────────────────────────────
    const user = await User.findById(tradingAcc.userId, { email: 1, firstName: 1, lastName: 1 }).lean();
    if (user) {
      const userName    = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
      const accountName = accountDoc?.accountName ?? tradingAcc.login ?? tradingAccountId.toString();

      try {
          await resend.emails.send({
            from:    process.env.WEBSITE_MAIL,
            to:      user.email,
            subject: `Challenge Breach Notice — ${accountName}`,
            html:    breachEmail({ userName, accountName, reason }),
          });
      } catch (emailError) {
        console.error("[toNextStage] email failed:", emailError.message);
      }
    }

  } catch (err) {
    console.error(`[breachAccount] error for ${tradingAccountId}:`, err.message);
  }
};

const passAccount = async (tradingAccountId, nextPhase) => {
  try {
    const tradingAcc = await TradingAccount.findByIdAndUpdate(
      tradingAccountId,
      { $set: { status: "completed", lastSync: new Date() } },
      { new: true }
    ).lean();

    if (!tradingAcc) {
      console.error(`[passAccount] TradingAccount ${tradingAccountId} not found`);
      return;
    }

    const accountDoc = await Account.findByIdAndUpdate(
      tradingAcc.account,
      {
        $set: {
          status:     "Passed",
          passedOn:   new Date(),
          toNextStep: true,
          nextStep:   nextPhase ?? "",
        },
      },
      { new: true }
    ).lean();

    console.log(`[passAccount] ${tradingAccountId} → completed | Account → Passed${nextPhase ? ` → ${nextPhase}` : ""}`);

    const user = await User.findById(tradingAcc.userId, { email: 1, firstName: 1, lastName: 1 }).lean();
    if (user) {
      const userName    = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
      const accountName = accountDoc?.accountName ?? tradingAcc.login ?? tradingAccountId.toString();
      try {
          await resend.emails.send({
            from:    process.env.WEBSITE_MAIL,
            to:      user.email,
            subject: `Challenge Passed${nextPhase ? ` — Ready for ${nextPhase}` : ""} — ${accountName}`,
            html:    passEmail({ userName, accountName, reason }),
          });
      } catch (emailError) {
        console.error("[toNextStage] email failed:", emailError.message);
      }
    }

  } catch (err) {
    console.error(`[passAccount] error for ${tradingAccountId}:`, err.message);
  }
};

module.exports = { breachAccount, passAccount };