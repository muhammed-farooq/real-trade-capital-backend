const { nanoid } = require("nanoid");
const Account = require("../models/account");
const Payout = require("../models/payout");
const User = require("../models/user");
const CryptoJS = require("crypto-js");
const Withdrawal = require("../models/withdrawal");
const Package = require("../models/package");
const { notification } = require("./common");
const generateUniqueAccountName = () => `RTC-${nanoid(8).toUpperCase()}`;
const { Resend } = require("resend");
const {
  withdrawalRequest,
  withdrawalReject,
  withdrawalApprove,
  accountFailed,
} = require("../assets/html/payout");
const { createTradingAccount } = require("./tradingAccount");
const { copyWarningsToReplacement } = require("./analytics/utils/copyAccountWarnings");
const resend = new Resend(process.env.RESEND_SECRET_KEY);

const encryptPassword = (password) => {
  const secretKey = process.env.PASSWORD_SALT;
  return CryptoJS.AES.encrypt(password, secretKey).toString();
};

const getPayoutRequestOfUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentDate = new Date();

    const allPayoutRequests = await Payout.find({
      userId: userId,
    })
      .sort({ updatedAt: -1 })
      .populate({ path: "account", select: "accountName" });

    res.status(200).json({ allPayoutRequests: allPayoutRequests });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getPayoutRequestAdmin = async (req, res) => {
  try {
    const allPayoutRequests = await Payout.find({})
      .sort({
        // status: 1,
        updatedAt: -1,
      })
      .populate([{ path: "account", select: "accountName" }]);

    res.status(200).json({ allPayoutRequests: allPayoutRequests });
  } catch (error) {
    console.error("Error fetching payout requests:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAccountInPayoutRequest = async (req, res) => {
  try {
    const userId = req.params.id;

    // Get the current date
    const currentDate = new Date();

    const accountsPayout = await Account.find({
      userId: userId,
      status: "Ongoing",
      isBanned: false,
      withdrawIng: false,
      phase: "Funded",
      "MinimumTradingDays.Funded": { $lte: currentDate },
    })
    .sort({ updatedAt: 1 })
    .select("userId step accountName passedOn FundedStageCredentials");

    res.status(200).json({ allAccountsPayout: accountsPayout });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/* ── account status constants ────────────────────────────────────── */
const OLD_ACCOUNT_STATUS_APPROVED = "Withdrawn"; // approve / warning
const OLD_ACCOUNT_STATUS_REPLACED = "Replaced";  // replace (no payout, new account)
const OLD_ACCOUNT_STATUS_FAILED   = "Failed";    // reject (no payout, no new account)

async function createReplacementAccount({ oldAccount, credentials, isInstant }) {
  // reset minimum trading window for the next payout cycle
  const fundedMinDays = parseInt(oldAccount.MinimumTrading?.Funded) || 0;
  const minBase = new Date();
  const minTradingEndDate = new Date(
    minBase.setDate(minBase.getDate() + fundedMinDays)
  );
 
  // build payload
  const payload = {
    userId:        oldAccount.userId,
    name:          oldAccount.name,
    order:         oldAccount.order,
    package:       oldAccount.package,
    amountSize:    oldAccount.amountSize,
    platform:      oldAccount.platform,
    step:          oldAccount.step,
    mail:          oldAccount.mail,
    paymentMethod: oldAccount.paymentMethod,
    MinimumTrading: oldAccount.MinimumTrading,
 
    accountName:   generateUniqueAccountName(),
    phase:         "Funded",
    status:        "Ongoing",
 
    FundedStageCredentials: credentials,
    MinimumTradingDays: {
      ...(oldAccount.MinimumTradingDays?.toObject?.() ||
          oldAccount.MinimumTradingDays || {}),
      Funded: minTradingEndDate,
    },
 
    // Instant accounts inherit the original validity clock.
    // Non-instant gets a clean slate (no expiresAt).
    expiresAt:      isInstant ? (oldAccount.expiresAt || null) : null,
 
    withdrawsAmount: 0,
    fondedAccountNo: 0,
    withdrawIng:     false,
    approvedDate:    new Date(),
    createdAt:       new Date(),
 
    // Optional lineage tracking. If your Account schema doesn't have
    // this field yet, add it as: parentAccount: { type: ObjectId, ref:'Account' }
    parentAccount:   oldAccount._id,
  };
 
  const newAccount = await Account.create(payload);
 
  // Provision a TradingAccount for the new MT login (mirrors ApproveOrder)
  await createTradingAccount({
    userId:      newAccount.userId,
    orderId:     newAccount.order,
    accountId:   newAccount._id,
    packageId:   newAccount.package,
    accountSize: newAccount.amountSize,
    login:       credentials.username,
    phase:       "Funded",
    ...(newAccount.expiresAt && { expiresAt: newAccount.expiresAt }),
  });

  try {
    await copyWarningsToReplacement(oldAccount._id, newAccount._id);
  } catch (err) {
    console.error("[createReplacementAccount] warning copy failed:", err.message);
  }
 
  return newAccount;
}

const PayoutRequest = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { accountId, amount, method, BEP20Wallet } = req.body.formValue;
 
    if (!accountId)   return res.status(400).json({ errMsg: "Account ID is required" });
    if (!amount)      return res.status(400).json({ errMsg: "Amount is required" });
    if (isNaN(amount) || amount <= 0)
      return res.status(400).json({ errMsg: "Invalid amount" });
    if (!method)      return res.status(400).json({ errMsg: "Payment method is required" });
    if (!BEP20Wallet) return res.status(400).json({ errMsg: "TRC20 Wallet address is required" });
 
    const userData = await User.findById(userId);
    if (!userData)         return res.status(404).send({ errMsg: "User not found" });
    if (userData.isBanned)
      return res.status(403).send({ errMsg: "You are banned from making requests", timeout: true });
 
    const account = await Account.findOne({
      _id: accountId,
      status: "Ongoing",
      phase: "Funded",
      isBanned: false,
      "MinimumTradingDays.Funded": { $lte: new Date() },
    }).sort({ updatedAt: 1 });
 
    if (!account)
      return res.status(400).json({ errMsg: "Account not eligible for payout request" });
 
    account.withdrawIng = true;
 
    const newPayout = new Payout({
      name: userData.first_name + userData.last_name,
      userId,
      account: accountId,
      paymentMethod: method,
      mail: userData.email,
      platform: account.platform,
      step: account.step,
      requestedOn: new Date(),
      BEP20Wallet,
      amount: Number(amount),
      FundedStageCredentials: account.FundedStageCredentials,
    });
 
    const savedRequest = await newPayout.save();
    await account.save();
 
    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: process.env.ADMIN_OFFICIAL,
        subject: "New Payout Request Notification",
        html: withdrawalRequest(newPayout.name),
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res.status(500).json({ errMsg: "Failed to send verification email." });
    }
 
    if (savedRequest) {
      return res.status(200).json({ msg: "Your request has been submitted successfully" });
    }
    return res.status(500).json({ errMsg: "Failed to submit the payout request" });
  } catch (error) {
    console.error("Error processing payout request:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const ApprovePayout = async (req, res) => {
  try {
    const { formValue, payoutId } = req.body;
    if (!formValue || !payoutId)
      return res.status(400).json({ errMsg: "Fill the form" });
 
    const { txnId, note, username, email, password, server, platform } = formValue;
 
    if (!txnId || !username || !email || !password || !server || !platform) {
      return res.status(400).json({ errMsg: "Fill the form" });
    }
 
    /* ── load entities ─────────────────────────────────────────── */
    const payout = await Payout.findById(payoutId);
    if (!payout) return res.status(404).json({ errMsg: "Payout not found" });
 
    const oldAccount = await Account.findOne({ _id: payout.account });
    if (!oldAccount) return res.status(404).json({ errMsg: "Account not found" });
 
    const packageData = await Package.findById(oldAccount.package);
    if (!packageData) return res.status(404).json({ errMsg: "Package not found" });
    const isInstant = packageData.PackageType === "instant";
 
    const user = await User.findById(payout.userId);
    if (!user) return res.status(404).json({ errMsg: "User not found" });
 
    /* ── mark payout processed ─────────────────────────────────── */
    payout.approvedDate = new Date();
    payout.txnStatus    = "Processed";
    payout.status       = "Processed";
    payout.txnId        = txnId;
    payout.note         = note;
 
    /* ── close old account ─────────────────────────────────────── */
    const prevWithdraws  = parseFloat(oldAccount.withdrawsAmount || "0");
    const payoutAmount   = parseFloat(payout.amount);
 
    oldAccount.fondedAccountNo = (oldAccount.fondedAccountNo || 0) + 1;
    oldAccount.withdrawsAmount = Number((prevWithdraws + payoutAmount).toFixed(2));
    oldAccount.withdrawIng     = false;
    oldAccount.status          = OLD_ACCOUNT_STATUS_APPROVED;
    oldAccount.closedAt        = new Date();
 
    /* ── create replacement account ────────────────────────────── */
    const credentials = {
      email,
      username,
      password: encryptPassword(password),
      server,
      platform,
    };
 
    const newAccount = await createReplacementAccount({
      oldAccount,
      credentials,
      isInstant,
    });
 
    payout.replacementAccount = newAccount._id; // requires schema field; optional
 
    /* ── withdrawal record (unchanged) ─────────────────────────── */
    const newWithdrawal = new Withdrawal({
      name:          payout.name,
      userId:        payout.userId,
      account:       payout.account,         // points at the closed account
      paymentMethod: payout.paymentMethod,
      platform:      oldAccount.platform,
      step:          oldAccount.step,
      txnId:         payout.txnId,
      amount:        payout.amount,
      isAffiliate:   payout.isAffiliate,
    });
 
    /* ── notification ──────────────────────────────────────────── */
    user.notifications.push(
      notification(
        "/dashboard/payouts",
        "good",
        `$${payout.amount} withdrawal from ${oldAccount.accountName} processed. ` +
        `New account ${newAccount.accountName} is ready for trading.`
      )
    );
    user.notificationsCount += 1;
 
    /* ── persist ───────────────────────────────────────────────── */
    await Promise.all([
      payout.save(),
      oldAccount.save(),
      user.save(),
      newWithdrawal.save(),
    ]);
 
    /* ── email ─────────────────────────────────────────────────── */
    try {
      await resend.emails.send({
        from:    process.env.WEBSITE_MAIL,
        to:      user.email,
        subject: "Payout Approved — Your New Account Is Ready",
        html: withdrawalApprove(payout.name, {
          newAccountName: newAccount.accountName,
          oldAccountName: oldAccount.accountName,
          amount:         payout.amount,
          platform:       newAccount.platform,
          expiresAt:      newAccount.expiresAt,
          isInstant,
        })
      });
    } catch (emailError) {
      // Don't fail the whole request just because email failed
      console.error("[ApprovePayout] Email send failed:", emailError);
    }
 
    return res.status(200).json({
      success: true,
      msg: "Payout approved and replacement account created",
      newAccount: { id: newAccount._id, accountName: newAccount.accountName },
    });
  } catch (error) {
    console.error("Error approving payout:", error);
    return res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const replacePayout = async (req, res) => {
  try {
    const { formValue, payoutId } = req.body;
    if (!formValue || !payoutId)
      return res.status(400).json({ errMsg: "Fill the form" });
 
    const { note, username, email, password, server, platform } = formValue;
    if (!username || !email || !password || !server || !platform)
      return res.status(400).json({ errMsg: "Fill the form" });
 
    /* ── load entities ─────────────────────────────────────────── */
    const payout = await Payout.findById(payoutId);
    if (!payout) return res.status(404).json({ errMsg: "Payout not found" });
 
    const oldAccount = await Account.findOne({ _id: payout.account });
    if (!oldAccount) return res.status(404).json({ errMsg: "Account not found" });
 
    const packageData = await Package.findById(oldAccount.package);
    if (!packageData) return res.status(404).json({ errMsg: "Package not found" });
    const isInstant = packageData.PackageType === "instant";
 
    const user = await User.findById(payout.userId);
    if (!user) return res.status(404).json({ errMsg: "User not found" });
 
    /* ── payout: cancelled (no funds moved) ────────────────────── */
    payout.payoutCancelledAt = new Date();
    payout.txnStatus = "Cancelled";
    payout.status    = "Cancelled";
    payout.note      = note;
 
    /* ── close old account ─────────────────────────────────────── */
    oldAccount.fondedAccountNo = (oldAccount.fondedAccountNo || 0) + 1;
    oldAccount.withdrawIng     = false;
    oldAccount.status          = OLD_ACCOUNT_STATUS_REPLACED;
    oldAccount.closedAt        = new Date();
 
    /* ── create replacement ────────────────────────────────────── */
    const credentials = {
      email,
      username,
      password: encryptPassword(password),
      server,
      platform,
    };
    const newAccount = await createReplacementAccount({
      oldAccount,
      credentials,
      isInstant,
    });
 
    payout.replacementAccount = newAccount._id;
 
    /* ── notify ────────────────────────────────────────────────── */
    user.notifications.push(
      notification(
        "/dashboard/payouts",
        "warn",
        `Payout from ${oldAccount.accountName} was not processed this cycle. ` +
        `A new account ${newAccount.accountName} has been issued for continued trading.`
      )
    );
    user.notificationsCount += 1;
 
    await Promise.all([
      payout.save(),
      oldAccount.save(),
      user.save(),
    ]);
 
    /* ── email ─────────────────────────────────────────────────── */
    try {
      await resend.emails.send({
        from:    process.env.WEBSITE_MAIL,
        to:      user.email,
        subject: "Payout Update — New Account Issued",
        html: withdrawalReject(payout.name, {
          newAccountName: newAccount.accountName,
          oldAccountName: oldAccount.accountName,
          amount:         payout.amount,
          platform:       newAccount.platform,
          expiresAt:      newAccount.expiresAt,
          isInstant,
          note,
        })
      });
    } catch (emailError) {
      console.error("[replacePayout] Email send failed:", emailError);
    }
 
    return res.status(200).json({
      success: true,
      msg: "Account replaced; no payout processed",
      newAccount: { id: newAccount._id, accountName: newAccount.accountName },
    });
  } catch (error) {
    console.error("Error replacing payout:", error);
    return res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};
 
const rejectPayout = async (req, res) => {
  try {
    const { payoutId, note } = req.body;
    if (!payoutId || !note)
      return res.status(400).json({ errMsg: "Payout ID and note are required" });
 
    const payout = await Payout.findById(payoutId);
    if (!payout) return res.status(404).json({ errMsg: "Payout not found" });
 
    const user = await User.findById(payout.userId);
    if (!user) return res.status(404).json({ errMsg: "User not found" });
 
    /* ── payout: cancelled ─────────────────────────────────────── */
    payout.payoutCancelledAt = new Date();
    payout.txnStatus = "Cancelled";
    payout.status    = "Cancelled";
    payout.note      = note;
 
    /* ── if tied to an account: close it as Failed ─────────────── */
    let failedAccount = null;
    if (payout.account) {
      failedAccount = await Account.findOne({ _id: payout.account });
      if (!failedAccount) return res.status(404).json({ errMsg: "Account not found" });
 
      failedAccount.withdrawIng = false;
      failedAccount.status      = OLD_ACCOUNT_STATUS_FAILED;
      failedAccount.closedAt    = new Date();
 
      user.notifications.push(
        notification(
          "/dashboard/payouts",
          "err",
          `Account ${failedAccount.accountName} has been closed. Payout denied.`
        )
      );
      user.notificationsCount += 1;
    }
 
    /* ── affiliate-only payout (no account on the doc) ─────────── */
    if (payout.isAffiliate) {
      user.notifications.push(
        notification(
          "/dashboard/payouts",
          "err",
          `$${payout.amount} affiliate withdrawal denied.`
        )
      );
      user.notificationsCount += 1;
      user.withdrawIng = false;
    }
 
    await Promise.all([
      payout.save(),
      user.save(),
      ...(failedAccount ? [failedAccount.save()] : []),
    ]);
 
    /* ── email ─────────────────────────────────────────────────── */
    try {
      await resend.emails.send({
        from:    process.env.WEBSITE_MAIL,
        to:      user.email,
        subject: failedAccount
          ? "Account Closed — Payout Denied"
          : "Payout Request Denied",
        html: accountFailed(payout.name, {
              accountName: failedAccount?.accountName,
              amount:      payout.amount,
              note,
              isAffiliate: !!payout.isAffiliate,
            })
      });
    } catch (emailError) {
      console.error("[rejectPayout] Email send failed:", emailError);
    }
 
    return res.status(200).json({ success: true, msg: "Payout rejected" });
  } catch (error) {
    console.error("Error rejecting payout:", error);
    return res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const affiliatePayoutRequest = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { amount, method, BEP20Wallet } = req.body.formValue;
    console.log(amount, method, BEP20Wallet);

    // Validate the request data
    if (!amount) return res.status(400).json({ errMsg: "Amount is required" });
    if (isNaN(amount))
      return res.status(400).json({ errMsg: "Invalid amount" });
    if (amount < 20)
      return res.status(400).json({ errMsg: "Min Amount is 20$" });
    if (!method)
      return res.status(400).json({ errMsg: "Payment method is required" });
    if (!BEP20Wallet)
      return res
        .status(400)
        .json({ errMsg: "BEP20 Wallet address is required" });

    // Fetch user data
    const userData = await User.findById(userId);
    if (!userData) return res.status(404).send({ errMsg: "User not found" });
    if (userData.isBanned)
      return res.status(403).send({ errMsg: "You are banned", timeout: true });
    if (!userData.isVerify)
      return res
        .status(403)
        .send({ errMsg: "You are not verified", timeout: true });

    if (userData.wallet < amount) {
      return res.status(400).json({ errMsg: "You don't have enough amount" });
    }
    if (userData.withdrawIng) {
      return res
        .status(400)
        .json({ errMsg: "You already requested wait for the approval" });
    }

    userData.withdrawIng = true;

    const newPayout = new Payout({
      name: userData.first_name + userData.last_name,
      mail: userData.email,
      userId: userId,
      paymentMethod: method,
      requestedOn: new Date(),
      BEP20Wallet,
      amount:Number(amount),
      isAffiliate: true,
    });
    console.log(newPayout, userData);

    await userData.save();
    const savedRequest = await newPayout.save();

    const userName = newPayout.name;
    const htmlContent = withdrawalRequest(userName);
    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: process.env.ADMIN_OFFICIAL,
        subject: "New Payout Request Notification",
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }
    if (savedRequest) {
      return res
        .status(200)
        .json({ msg: "Your request has been submitted successfully" });
    } else {
      return res
        .status(500)
        .json({ errMsg: "Failed to submit the payout request" });
    }
  } catch (error) {
    console.error("Error processing payout request:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

const affiliateApprovePayout = async (req, res) => {
  try {
    const { formValue, payoutId, userId } = req.body;

    const { txnId, note } = formValue;

    // Basic validation checks
    if (!formValue || !payoutId || !txnId) {
      console.log(`Form data missing or incomplete: payoutId: ${payoutId}`);
      return res
        .status(400)
        .json({ errMsg: "Please fill out all required fields." });
    }

    // Find the payout by ID
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      console.log(`Payout not found for payoutId: ${payoutId}`);
      return res.status(404).json({ errMsg: "Payout not found." });
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User not found for userId: ${userId}`);
      return res.status(404).json({ errMsg: "User not found." });
    }

    // Update payout details
    payout.approvedDate = new Date();
    payout.txnStatus = "Processed";
    payout.status = "Processed";
    payout.txnId = txnId;
    payout.note = note;

    const amount = Number(payout.amount);

    // if (!isNaN(payout.amount)) {
    //   user.affiliate_paidOut += payout.amount;
    //   user.wallet -= payout.amount;
    //   user.withdrawIng = false;
    // } else {
    //   console.log("Payout amount is not a valid number:", payout.amount);
    //   return res.status(400).json({ errMsg: "Invalid payout amount." });
    // }

    if (isNaN(amount)) {
      console.log("Payout amount is not a valid number:", payout.amount);
      return res.status(400).json({ errMsg: "Invalid payout amount." });
    }

    user.affiliate_paidOut = (Number(user.affiliate_paidOut) || 0) + amount;
    user.wallet = (Number(user.wallet) || 0) - amount;
    user.withdrawIng = false;

    user.notifications.push(
      notification(
        "/dashboard/payouts",
        "good",
        `$${payout.amount} withdrawal from affiliation ${payout.status}`
      )
    );
    user.notificationsCount += 1;

    // Log the updated payout
    console.log(
      "Payout updated and saved:",
      user.affiliate_paidOut,
      user.wallet
    );

    // Create a new withdrawal record
    const newWithdrawal = new Withdrawal({
      name: payout.name,
      userId: payout.userId,
      paymentMethod: payout.paymentMethod,
      txnId: payout.txnId,
      amount: payout.amount,
      isAffiliate: payout.isAffiliate,
    });

    // Save changes to the database
    await newWithdrawal.save();
    await payout.save();
    await user.save();
    const userName = payout.name;
    const htmlContent = withdrawalApprove(userName);

    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: user.email,
        subject: "Payout Approved",
        html: htmlContent,
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }

    try {
      await resend.emails.send({
        from: process.env.WEBSITE_MAIL,
        to: user.email,
        subject: "Verification mail from REAL TRADE CAPITAL",
        html: htmlContent,
      });
      console.log("Verification email sent successfully.");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return res
        .status(500)
        .json({ errMsg: "Failed to send verification email." });
    }
    // Respond with success
    return res
      .status(200)
      .json({ success: true, msg: "Payout approved successfully." });
  } catch (error) {
    console.error("Error approving payout:", error);
    return res
      .status(500)
      .json({ success: false, errMsg: "Internal server error." });
  }
};

const singleUserData = async (req, res) => {
  try {
    const userData = await User.findById(req.payload.id);
    console.log(userData.notifications);
    if (!userData) {
      return res.status(404).send({ errMsg: "User not found" });
    } else if (userData?.isBanned) {
      return res
        .status(404)
        .send({ errMsg: "You can not request", isBanned: true, timeout: true });
    }
    res.status(200).json({ userData });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getPayoutRequestOfUser,
  getPayoutRequestAdmin,
  singleUserData,
  getAccountInPayoutRequest,
  PayoutRequest,
  replacePayout,
  ApprovePayout,
  rejectPayout,
  affiliatePayoutRequest,
  affiliateApprovePayout,
};
