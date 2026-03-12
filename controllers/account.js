const Account = require("../models/account");
const CryptoJS = require("crypto-js");
const User = require("../models/user");
const { notification } = require("./common");
const TradingAccount = require("../models/dashboard/tradingAcc")
const { nanoid } = require("nanoid");
const generateUniqueAccountName = () => `RTC-${nanoid(8).toUpperCase()}`;
const { Resend } = require("resend");
const {
  toNext,
  accountFunded,
  accountPhaseTwo,
  accountFailed,
} = require("../assets/html/account");

const resend = new Resend(process.env.RESEND_SECRET_KEY);
``;
const encryptPassword = (password) => {
  const secretKey = process.env.PASSWORD_SALT;
  return CryptoJS.AES.encrypt(password, secretKey).toString();
};

const getAccountLists = async (req, res) => {
  try {
    const userId = req.params.id;
    const accounts = await Account.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ allAccounts: accounts });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const getAllTheRequests = async (req, res) => {
  try {
    const accounts = await Account.find({ toNextStep: true })
      .sort({ createdAt: -1 })
      .populate("userId", "first_name last_name email")
      .exec();

    res.status(200).json({ accounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    res.status(500).json({ msg: "Server error" });
  }
};

const toNextStage = async (req, res) => {
  try {
    const { accountId } = req.body;
    const account = await Account.findOne({ _id: accountId });
 
    if (!account)
      return res.status(404).json({ errMsg: "Account not found." });
 
    // Must be actively trading to request upgrade
    if (account.status !== "Ongoing")
      return res.status(400).json({ errMsg: `Account status is ${account.status}. Only Ongoing accounts can request a phase upgrade.` });
 
    // Already requested — prevent duplicates
    if (account.toNextStep)
      return res.status(409).json({ errMsg: "You have already requested to move to the next step." });
 
    // Funded is the terminal phase — nothing to upgrade to
    if (account.phase === "Funded")
      return res.status(400).json({ errMsg: "Account is already at the Funded stage." });
 
    // ── Minimum trading days check ────────────────────────────────────────────
    const now = new Date();
    const phaseKey = account.phase === "Phase One" ? "PhaseOne" : "PhaseTwo";
    const minDate  = account.MinimumTradingDays?.[phaseKey];
 
    if (minDate && now < minDate) {
      return res.status(400).json({
        errMsg: `Minimum trading days not yet completed. Available from ${minDate.toDateString()}.`,
      });
    }
 
    // ── Determine nextStep based on step type and current phase ───────────────
    //   stepOne:  Phase One → Funded
    //   stepTwo:  Phase One → Phase Two → Funded
    if (account.step === "stepOne") {
      if (account.phase === "Phase One") account.nextStep = "Funded";
 
    } else if (account.step === "stepTwo") {
      if      (account.phase === "Phase One") account.nextStep = "Phase Two";
      else if (account.phase === "Phase Two") account.nextStep = "Funded";
      else return res.status(400).json({ errMsg: "Unexpected phase for stepTwo." });
 
    } else {
      return res.status(400).json({ errMsg: `Unknown step type: ${account.step}` });
    }
 
    account.toNextStep  = true;
    account.requestedOn = new Date();
    await account.save();
 
    // ── Notify admin ──────────────────────────────────────────────────────────
    try {
      await resend.emails.send({
        from:    process.env.WEBSITE_MAIL,
        to:      process.env.ADMIN_OFFICIAL,
        subject: "New Phase Upgrade Request Notification",
        html:    toNext(account.accountName),
      });
    } catch (emailError) {
      // Non-fatal — request is already saved, don't block the response
      console.error("[toNextStage] email failed:", emailError.message);
    }
 
    return res.status(200).json({ account, msg: "Request sent successfully." });
 
  } catch (error) {
    console.error("[toNextStage]", error);
    return res.status(500).json({ msg: "Server error." });
  }
};
 
 
const ApproveRequest = async (req, res) => {
  try {
    const { formValue, accountId } = req.body;
    const { username, email, password, server, platform } = formValue;
    const hashedPassword = encryptPassword(password);
 
    // ── Load account + package ────────────────────────────────────────────────
    const account = await Account.findOne({ _id: accountId }).populate("package");
    if (!account) return res.status(404).json({ error: "Account not found" });
    if (!account.toNextStep) return res.status(400).json({ error: "No pending upgrade request on this account" });
 
    const packageData = account.package;
    if (!packageData) return res.status(404).json({ error: "Package not found on account" });
 
    const user = await User.findById(account.userId);
    if (!user) return res.status(404).json({ error: "User not found" });
 
    // ── Get current TradingAccount to carry over live balance ─────────────────
    const currentTradingAccount = await TradingAccount.findOne({
      account: account._id,
      status:  "active",
    });
 
    // ── Helper: strip "%" and parse numeric strings from Package schema ────────
    const toNum = (v, fallback) => {
      const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
      return isNaN(n) ? fallback : n;
    };
 
    // ── Resolve config for the new phase ─────────────────────────────────────
    let newPhase           = "";
    let newChallengeConfig = null;
    let minTradingDays     = 0;
    const newCredentials   = { email, username, password: hashedPassword, server, platform };
 
    if (account.nextStep === "Phase Two") {
      const p2       = packageData.evaluationStage.PhaseTwo;
      newPhase       = "Phase Two";
      minTradingDays = parseInt(account.MinimumTrading.PhaseTwo) || 0;
      newChallengeConfig = {
        maxDailyLoss:   toNum(p2.MaximumDailyLoss,   5),
        maxTotalLoss:   toNum(p2.MaximumLoss,        10),
        profitTarget:   toNum(p2.ProfitTarget,        5),
        minTradingDays: toNum(p2.MinimumTradingDays, 10),
        maxLotSize:     5,
      };
 
    } else if (account.nextStep === "Funded") {
      const funded   = packageData.fundedStage;
      newPhase       = "Funded";
      minTradingDays = parseInt(account.MinimumTrading.Funded) || 0;
      newChallengeConfig = {
        maxDailyLoss:   toNum(funded.MaximumDailyLoss,   5),
        maxTotalLoss:   toNum(funded.MaximumLoss,        10),
        profitTarget:   toNum(funded.ProfitTarget,        0),
        minTradingDays: toNum(funded.MinimumTradingDays, 10),
        maxLotSize:     5,
      };
 
    } else {
      return res.status(400).json({ error: `Invalid nextStep value: "${account.nextStep}"` });
    }
 
    // ── Close out old account ─────────────────────────────────────────────────
    // "Passed" = completed this phase successfully — valid enum value in schema
    account.nextStep   = "";
    account.toNextStep = false;
    account.status     = "Passed";  // ✅ valid enum: "Not Passed"|"Passed"|"Pending"|"Ongoing"|"Cancelled"
    await account.save();
 
    // ── Close out old TradingAccount ──────────────────────────────────────────
    if (currentTradingAccount) {
      currentTradingAccount.status = "completed";
      await currentTradingAccount.save();
    }
 
    // ── Build MinimumTradingDays for new account ───────────────────────────────
    // Spread previous dates (PhaseOne date carries over for reference),
    // then set the new phase's date. Strip _id from the subdoc toObject.
    const { _id: _omit, ...prevMinDays } = account.MinimumTradingDays?.toObject?.() ?? {};
    const minTradingDaysDate = new Date(Date.now() + minTradingDays * 86400000);
 
    // ── Create NEW Account doc for the new phase ──────────────────────────────
    // status = "Ongoing" — trader is now actively in the new phase
    // "Passed" only applies when they finish/exit, not when they enter
    const newAccount = await Account.create({
      userId:        account.userId,
      name:          account.name,
      mail:          account.mail,
      order:         account.order,
      package:       packageData._id,
      amountSize:    account.amountSize,
      platform,
      step:          account.step,
      paymentMethod: account.paymentMethod,
      accountName:   generateUniqueAccountName(),
      phase:         newPhase,
      status:        "Ongoing",   // ✅ enters new phase as Ongoing, NOT Passed
      approvedDate:  new Date(),
      MinimumTrading: account.MinimumTrading,
      MinimumTradingDays: {
        ...prevMinDays,
        ...(newPhase === "Phase Two" && { PhaseTwo: minTradingDaysDate }),
        ...(newPhase === "Funded"    && { Funded:   minTradingDaysDate }),
      },
      ...(newPhase === "Phase Two" && {
        PhaseTwoCredentials: newCredentials,
        toPhaseTwoOn:        new Date(),
      }),
      ...(newPhase === "Funded" && {
        FundedStageCredentials: newCredentials,
        toFundedOn:            new Date(), 
      }),
    });
 
    // ── Create NEW TradingAccount ─────────────────────────────────────────────
    await TradingAccount.create({
      userId:          account.userId,
      account:         newAccount._id,
      order:           account.order,
      login :          username,
      startingBalance: Number(account.amountSize),
      challengeConfig: newChallengeConfig,
      platform,
      status:          "pending",
    });
 
    // ── Notify user ───────────────────────────────────────────────────────────
    user.notifications.push(
      notification(
        "/dashboard",
        "good",
        `Your account "${account.accountName}" successfully advanced to ${newPhase}`
      )
    );
    user.notificationsCount += 1;
    await user.save();
 
    // ── Email ─────────────────────────────────────────────────────────────────
    const htmlContent = newPhase === "Funded"
      ? accountFunded(newAccount.accountName, account.name)
      : accountPhaseTwo(newAccount.accountName, account.name);
 
    const subject = newPhase === "Funded"
      ? "Passed to Funded Stage"
      : "Passed to Second Phase";
 
    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to:   user.email,
        subject,
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("[ApproveRequest] email failed:", emailError.message);
      // Non-fatal — account already created, don't block response
    }
 
    return res.status(200).json({ success: true, msg: "Request approved successfully" });
 
  } catch (error) {
    console.error("[ApproveRequest]", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// const ApproveRequest = async (req, res) => {
//   try {
//     const { formValue, accountId } = req.body;
//     console.log("Request body:", req.body);

//     const { username, email, password, server, platform } = formValue;
//     const hashedPassword = encryptPassword(password);

//     const account = await Account.findOne({ _id: accountId });
//     if (!account) {
//       console.log(`Account not found for accountId: ${accountId}`);
//       return res.status(404).json({ error: "Account not found" });
//     }
//     console.log(username, email, password, server, platform);
//     if (account.nextStep == "Phase Two") {
//       account.PhaseTwoCredentials = {
//         email,
//         username,
//         password: hashedPassword,
//         server,
//         platform,
//       };
//       account.phase = "Phase Two";
//       const phaseTwoMinTradingDays = parseInt(account.MinimumTrading.PhaseTwo);
//       const currentDate = new Date();
//       account.MinimumTradingDays.PhaseTwo = new Date(
//         currentDate.setDate(currentDate.getDate() + phaseTwoMinTradingDays)
//       );

//       account.toPhaseTwoOn = new Date();
//     } else if (account.nextStep == "Funded") {
//       account.FundedStageCredentials = {
//         email,
//         username,
//         password: hashedPassword,
//         server,
//         platform,
//       };
//       account.phase = "Funded";
//       account.status = "Passed";
//       account.passedOn = new Date();
//       const fundedMinTradingDays = parseInt(account.MinimumTrading.Funded);
//       const currentDate = new Date();
//       account.MinimumTradingDays.Funded = new Date(
//         currentDate.setDate(currentDate.getDate() + fundedMinTradingDays)
//       );
//     }
//     account.nextStep = "";
//     account.toNextStep = false;

//     const user = await User.findById(account.userId);
//     if (!user) {
//       console.log(`Account not found for accountId: ${accountId}`);
//       return res.status(404).json({ error: "user not found" });
//     }
//     user.notifications.push(
//       notification(
//         "/dashboard",
//         "good",
//         `Your "${account.accountName}" successfully passed to ${account.phase}`
//       )
//     );
//     user.notificationsCount += 1;
//     await account.save();
//     await user.save();
//     const accountName = account.accountName;
//     const userName = account.name;
//     const htmlContent =
//       account.phase == "Funded"
//         ? accountFunded(accountName, userName)
//         : (account.phase = "Phase Two"
//             ? accountPhaseTwo(accountName, userName)
//             : "");

//     try {
//       await resend.emails.send({
//         from: process.env.WEBSITE_MAIL,
//         to: user.email,
//         subject:
//           account.phase == "Funded"
//             ? "Passed to Funded Stage"
//             : (account.phase = "Phase Two"
//                 ? "Passed to Second Phase"
//                 : "New Notification"),
//         html: htmlContent,
//       });
//     } catch (emailError) {
//       console.error("Error sending email:", emailError);
//       return res
//         .status(500)
//         .json({ errMsg: "Failed to send verification email." });
//     }
//     console.log("Account updated and saved:", account);

//     res
//       .status(200)
//       .json({ success: true, msg: "Request approved successfully" });
//   } catch (error) {
//     console.error("Error approving order:", error);
//     res.status(500).json({ success: false, error: "Internal server error" });
//   }
// };

const rejectRequest = async (req, res) => {
  try {
    const { reason, accountId } = req.body;
    const account = await Account.findOne({ _id: accountId });
    if (!account) {
      console.log(`Account not found for accountId: ${accountId}`);
      return res.status(404).json({ error: "Account not found" });
    }
    console.log(reason);
    account.failedOn = new Date();
    account.reasonForReject = reason;
    account.note = reason;
    account.nextStep = "";
    account.status = "Not Passed";
    account.toNextStep = false;

    const user = await User.findById(account.userId);
    if (!user) {
      console.log(`Account not found for accountId: ${accountId}`);
      return res.status(404).json({ error: "user not found" });
    }
    user.notifications.push(
      notification(
        "/dashboard",
        "err",
        `Your ${account.accountName} request rejected`
      )
    );
    user.notificationsCount += 1;
    await user.save();
    await account.save();
    const accountName = account.accountName;
    const userName = account.name;
    const htmlContent = accountFailed(accountName, userName);
    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: user.email,
        subject: "Breach Out Notification",
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }
    console.log("Account updated and saved:", account);

    res
      .status(200)
      .json({ success: true, msg: "Request rejected successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};
module.exports = {
  getAccountLists,
  toNextStage,
  ApproveRequest,
  getAllTheRequests,
  rejectRequest,
};
