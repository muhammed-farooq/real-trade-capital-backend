const Account = require("../models/account");
const Payout = require("../models/payout");
const User = require("../models/user");
const CryptoJS = require("crypto-js");
const Withdrawal = require("../models/withdrawal");
const { notification } = require("./common");
``;
const { Resend } = require("resend");
const {
  withdrawalRequest,
  withdrawalReject,
  withdrawalApprove,
} = require("../assets/html/payout");

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

    // if (!allPayoutRequests.length) {
    //   return res
    //     .status(404)
    //     .json({ message: "No accounts found for payout request." });
    // }

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

    // const allPayoutRequests = await Payout.find({})
    //   .sort({
    //     updatedAt: -1,
    //   })
    //   .populate([
    //     {
    //       path: "account",
    //       select: "accountName",
    //       // Ensure that the `account` field can be null or undefined
    //       match: { account: { $exists: true, $ne: null } },
    //     },
    //     {
    //       path: "userId",
    //       select: "email",
    //     },
    //   ]);
    console.log(allPayoutRequests);

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
      status: "Passed",
      isBanned: false,
      withdrawIng: false,
      phase: "Funded",
      "MinimumTradingDays.Funded": { $lte: currentDate },
    })
      .sort({ updatedAt: 1 })
      .select("userId step accountName passedOn FundedStageCredentials");

    // if (!accountsPayout.length) {
    //   return res
    //     .status(404)
    //     .json({ message: "No accounts found for payout request." });
    // }

    res.status(200).json({ allAccountsPayout: accountsPayout });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const PayoutRequest = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { accountId, amount, method, TRC20Wallet } = req.body.formValue;
    console.log(accountId, amount, method, TRC20Wallet);

    // Validate the request data
    if (!accountId)
      return res.status(400).json({ errMsg: "Account ID is required" });
    if (!amount) return res.status(400).json({ errMsg: "Amount is required" });
    if (isNaN(amount) || amount <= 0)
      return res.status(400).json({ errMsg: "Invalid amount" });
    if (!method)
      return res.status(400).json({ errMsg: "Payment method is required" });
    if (!TRC20Wallet)
      return res
        .status(400)
        .json({ errMsg: "TRC20 Wallet address is required" });

    // Fetch user data
    const userData = await User.findById(userId);
    if (!userData) return res.status(404).send({ errMsg: "User not found" });
    if (userData.isBanned)
      return res
        .status(403)
        .send({ errMsg: "You are banned from making requests", timeout: true });

    // Fetch account data
    const account = await Account.findOne({
      _id: accountId,
      status: "Passed",
      phase: "Funded",
      isBanned: false,
      "MinimumTradingDays.Funded": { $lte: new Date() },
    }).sort({ updatedAt: 1 });

    if (!account) {
      return res
        .status(400)
        .json({ errMsg: "Account not eligible for payout request" });
    }
    account.withdrawIng = true;

    // Create new payout request
    const newPayout = new Payout({
      name: userData.first_name + userData.last_name,
      userId: userId,
      account: accountId,
      paymentMethod: method,
      mail: userData.email,
      platform: account.platform,
      step: account.step,

      requestedOn: new Date(),
      TRC20Wallet,
      amount: Number(amount),
      FundedStageCredentials: account.FundedStageCredentials,
    });

    const savedRequest = await newPayout.save();
    await account.save();

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

const ApprovePayout = async (req, res) => {
  try {
    const { formValue, payoutId } = req.body;
    console.log("Payout body:", req.body);

    const { txnId, note } = formValue;
    const { username, email, password, server, platform } = formValue;

    const hashedPassword = encryptPassword(password);

    if (
      !formValue ||
      !payoutId ||
      !txnId ||
      !username ||
      !email ||
      !password ||
      !server ||
      !platform
    ) {
      console.log(`payout not found for payoutId: ${payoutId}`);
      return res.status(404).json({ errMsg: "Fill the form" });
    }
    const payout = await Payout.findById(payoutId);
    if (!payout) {
      console.log(`payout not found for payoutId: ${payoutId}`);
      return res.status(404).json({ errMsg: "payout not found" });
    }
    const account = await Account.findOne({ _id: payout.account });
    if (!account) {
      console.log(`Account not found for accountId: ${payout.account}`);
      return res.status(404).json({ errMsg: "Account not found" });
    }

    const currentWithdrawsAmount = parseFloat(account.withdrawsAmount || "0");
    const payoutAmount = parseFloat(payout.amount);

    console.log(txnId, note);
    payout.approvedDate = new Date();
    account.FundedStageCredentials = {
      email,
      username,
      password: hashedPassword,
      server,
      platform,
    };
    payout.txnStatus = "Processed";
    payout.status = "Processed";
    payout.txnId = txnId;
    payout.note = note;
    account.fondedAccountNo = account.fondedAccountNo + 1;
    account.withdrawsAmount = currentWithdrawsAmount + payoutAmount;
    account.withdrawIng = false;

    const user = await User.findById(payout.userId);
    if (!user) {
      console.log(`Account not found for accountI`);
      return res.status(404).json({ error: "user not found" });
    }
    user.notifications.push(
      notification(
        "/dashboard/payouts",
        "good",
        `$${payout.amount} withdrawal from ${account.accountName} ${payout.status}`
      )
    );
    user.notificationsCount += 1;
    await user.save();
    await payout.save();
    console.log("payout updated and saved:", payout);
    await account.save();
    console.log("payout updated and saved:", payout);
    const newWithdrawal = new Withdrawal({
      name: payout.name,
      userId: payout.userId,
      account: payout.account,
      paymentMethod: payout.paymentMethod,
      platform: account.platform,
      step: account.step,
      txnId: payout.txnId,
      amount: payout.amount,
      isAffiliate: payout.isAffiliate,
    });

    await newWithdrawal.save();

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
    res
      .status(200)
      .json({ success: true, msg: "Payout approved successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};


const rejectPayout = async (req, res) => {
  try {
    const { formValue, note, payoutId } = req.body;

    if (formValue) {
      const { formValue, payoutId } = req.body;
      console.log("Payout body:", req.body);

      const { note } = formValue;
      const { username, email, password, server, platform } = formValue;

      const hashedPassword = encryptPassword(password);

      if (
        !formValue ||
        !payoutId ||
        !username ||
        !email ||
        !password ||
        !server ||
        !platform
      ) {
        console.log(`payout not found for payoutId: ${payoutId}`);
        return res.status(404).json({ errMsg: "Fill the form" });
      }
      const payout = await Payout.findById(payoutId);
      if (!payout) {
        console.log(`payout not found for payoutId: ${payoutId}`);
        return res.status(404).json({ errMsg: "payout not found" });
      }
      const account = await Account.findOne({ _id: payout.account });
      if (!account) {
        console.log(`Account not found for accountId: ${payout.account}`);
        return res.status(404).json({ errMsg: "Account not found" });
      }
      payout.payoutCancelledAt = new Date();
      payout.txnStatus = "Cancelled";
      payout.status = "Cancelled";
      account.FundedStageCredentials = {
        email,
        username,
        password: hashedPassword,
        server,
        platform,
      };
      payout.note = note;
      account.fondedAccountNo = account.fondedAccountNo + 1;
      account.withdrawIng = false;
      const fundedMinTradingDays = parseInt(account.MinimumTrading.Funded);
      const currentDate = new Date();
      account.MinimumTradingDays.Funded = new Date(
        currentDate.setDate(currentDate.getDate() + fundedMinTradingDays)
      );

      const user = await User.findById(payout.userId);
      if (!user) {
        console.log(`Account not found for accountI`);
        return res.status(404).json({ error: "user not found" });
      }
      user.notifications.push(
        notification(
          "/dashboard/payouts",
          "err",
          `$${payout.amount} withdrawal from ${account.accountName} ${payout.status}`
        )
      );
      user.notificationsCount += 1;
      await user.save();
      await payout.save();
      console.log("payout updated and saved:", payout);
      await account.save();
      console.log("payout updated and saved:", payout);

      const userName = payout.name;
      const htmlContent = withdrawalReject(userName);

      try {
        await resend.emails.send({
          from: process.env.WEBSITE_MAIL,
          to: user.email,
          subject: "Payout Request Update",
          html: htmlContent,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res
          .status(500)
          .json({ errMsg: "Failed to send verification email." });
      }
      res
        .status(200)
        .json({ success: true, msg: "Payout rejected successfully" });
    } else if (note) {
      const payout = await Payout.findOne({ _id: payoutId });
      if (!payout) {
        console.log(`Payout not found for payoutId: ${payoutId}`);
        return res.status(404).json({ errMsg: "Payout not found" });
      }
      console.log(note);
      payout.payoutCancelledAt = new Date();
      payout.note = note;
      payout.txnStatus = "Cancelled";
      payout.status = "Cancelled";
      const user = await User.findById(payout.userId);
      if (!user) {
        console.log(`Account not found for accountI`);
        return res.status(404).json({ error: "user not found" });
      }
      if (payout.account) {
        const account = await Account.findOne({ _id: payout.account });
        if (!account) {
          return res.status(404).json({ errMsg: "Account not found" });
        }
        user.notifications.push(
          notification(
            "/dashboard/payouts",
            "err",
            `$${payout.amount} withdrawal from ${account.accountName} ${payout.status}`
          )
        );
        user.notificationsCount += 1;
        account.withdrawIng = false;
        await account.save();
      }
      if (payout.isAffiliate) {
        user.notifications.push(
          notification(
            "/dashboard/payouts",
            "err",
            `$${payout.amount} withdrawal from affiliation ${payout.status}`
          )
        );
        user.notificationsCount += 1;
        user.withdrawIng = false;
      }
      await user.save();
      await payout.save();
      console.log("Payout updated and saved:", payout);
      const userName = payout.name;
      const htmlContent = withdrawalReject(userName);

      try {
        await resend.emails.send({
          from: process.env.WEBSITE_MAIL,
          to: user.email,
          subject: "Payout Request Update",
          html: htmlContent,
        });
        console.log("Verification email sent successfully.");
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return res
          .status(500)
          .json({ errMsg: "Failed to send verification email." });
      }
      res
        .status(200)
        .json({ success: true, msg: "Payout rejected successfully" });
    }
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, errMsg: "Internal server error" });
  }
};

const affiliatePayoutRequest = async (req, res) => {
  try {
    const userId = req.payload.id;
    const { amount, method, TRC20Wallet } = req.body.formValue;
    console.log(amount, method, TRC20Wallet);

    // Validate the request data
    if (!amount) return res.status(400).json({ errMsg: "Amount is required" });
    if (isNaN(amount))
      return res.status(400).json({ errMsg: "Invalid amount" });
    if (amount < 20)
      return res.status(400).json({ errMsg: "Min Amount is 20$" });
    if (!method)
      return res.status(400).json({ errMsg: "Payment method is required" });
    if (!TRC20Wallet)
      return res
        .status(400)
        .json({ errMsg: "TRC20 Wallet address is required" });

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
        .json({ errMsg: "You all ready requested wait for the approval" });
    }

    userData.withdrawIng = true;

    const newPayout = new Payout({
      name: userData.first_name + userData.last_name,
      mail: userData.email,
      userId: userId,
      paymentMethod: method,
      requestedOn: new Date(),
      TRC20Wallet,
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

    // Update user's wallet and affiliate payout tracking
    if (!isNaN(payout.amount)) {
      user.affiliate_paidOut += payout.amount;
      user.wallet -= payout.amount;
      user.withdrawIng = false;
    } else {
      console.log("Payout amount is not a valid number:", payout.amount);
      return res.status(400).json({ errMsg: "Invalid payout amount." });
    }
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
  ApprovePayout,
  rejectPayout,
  affiliatePayoutRequest,
  affiliateApprovePayout,
};
