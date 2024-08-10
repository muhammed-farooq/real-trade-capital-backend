const Account = require("../models/account");
const Payout = require("../models/payout");
const User = require("../models/user");

const getPayoutRequestOfUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const currentDate = new Date();

    const allPayoutRequests = await Payout.find({
      userId: userId,
    }).sort({ updatedAt: 1 });

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
    const allPayoutRequests = await Payout.find({}).sort({
      status: 1,
      updatedAt: 1,
    });
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
    const { accountId, amount, method } = req.body.formValue;
    console.log(accountId, amount, method);

    const userData = await User.findById(userId);
    if (!userData) {
      return res.status(404).send({ errMsg: "User not found" });
    } else if (userData?.isBanned) {
      return res.status(404).send({ errMsg: "You can not request" });
    }

    const currentDate = new Date();
    const account = await Account.findOne({
      _id: accountId,
      status: "Passed",
      phase: "Funded",
      isBanned: false,
      // "MinimumTradingDays.Funded": { $lte: currentDate },
    }).sort({ updatedAt: 1 });
    console.log(account, "dgghd");
    if (!account) {
      return res
        .status(304)
        .json({ errMsg: "This accounts not ready for payout request." });
    }

    const newPayout = new Payout({
      name: account.name,
      userId: userId,
      account: accountId,
      paymentMethod: method,
      platform: account.platform,
      step: account.platform,
      accountName: account.accountName,
      requestedOn: currentDate,
      amount,
      FundedStageCredentials: account.FundedStageCredentials,
    });
    const savedRequest = await newPayout.save();
    if (savedRequest) res.status(200).json({ msg: "Your request sended" });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ message: "Server error" });
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
};
