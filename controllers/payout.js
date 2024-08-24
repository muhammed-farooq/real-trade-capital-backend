const Account = require("../models/account");
const Payout = require("../models/payout");
const User = require("../models/user");
const CryptoJS = require("crypto-js");
const Withdrawal = require("../models/withdrawal");
``;
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
      .sort({ updatedAt: 1 })
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
      .populate([
        { path: "account", select: "accountName" },
        { path: "userId", select: "email" },
      ]);
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
      // isBanned: false,
      // withdrawIng: false,
      phase: "Funded",
      // "MinimumTradingDays.Funded": { $lte: currentDate },
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
        .send({ errMsg: "You are banned from making requests" });

    // Fetch account data
    const account = await Account.findOne({
      _id: accountId,
      status: "Passed",
      phase: "Funded",
      isBanned: false,
      // "MinimumTradingDays.Funded": { $lte: new Date() },
    }).sort({ updatedAt: 1 });

    if (!account) {
      return res
        .status(400)
        .json({ errMsg: "Account not eligible for payout request" });
    }
    account.withdrawIng = true;

    await account.save();

    // Create new payout request
    const newPayout = new Payout({
      name: userData.first_name + userData.last_name,
      userId: userId,
      account: accountId,
      paymentMethod: method,
      platform: account.platform,
      step: account.step,
      requestedOn: new Date(),
      TRC20Wallet,
      amount,
      FundedStageCredentials: account.FundedStageCredentials,
    });

    const savedRequest = await newPayout.save();
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
      return res.status(404).json({ error: "Account not found" });
    }
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
    account.withdrawsAmount = account.withdrawsAmount + payout.amount;

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
    res
      .status(200)
      .json({ success: true, msg: "Payout approved successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const rejectPayout = async (req, res) => {
  try {
    const { note, payoutId } = req.body;
    const payout = await Payout.findOne({ _id: payoutId });
    if (!payout) {
      console.log(`Payout not found for payoutId: ${payoutId}`);
      return res.status(404).json({ error: "Payout not found" });
    }
    console.log(note);
    payout.payoutCancelledAt = new Date();
    payout.note = note;
    payout.txnStatus = "Cancelled";
    payout.status = "Cancelled";

    await payout.save();
    console.log("Payout updated and saved:", payout);

    res
      .status(200)
      .json({ success: true, msg: "Payout rejected successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const singleUserData = async (req, res) => {
  try {
    const userData = await User.findById(req.payload.id);
    if (!userData) {
      return res.status(404).send({ errMsg: "User not found" });
    } else if (userData?.isBanned) {
      return res
        .status(404)
        .send({ errMsg: "You can not request", isBanned: true });
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
};
