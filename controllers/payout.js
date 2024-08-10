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
    const accountId = req.params.id;
    const { configureAccount, billingDetails, payment, user, package } =
      req.body;
    // Get the current date
    const userData = await User.findById(user);
    if (!userData) {
      return res.status(404).send({ errMsg: "User not found" });
    } else if (userData?.isBanned) {
      return res.status(404).send({ errMsg: "You can not request" });
    }
    const currentDate = new Date();

    // Find accounts that are passed and belong to the user, and have completed the minimum trading days for the funded stage
    const accountsPayout = await Account.findOne({
      _id: accountId,
      status: "Passed",
      phase: "Funded",
      "MinimumTradingDays.Funded": { $lte: currentDate },
    }).sort({ updatedAt: 1 });

    if (!accountsPayout.length) {
      return res
        .status(304)
        .json({ errMsg: "This accounts not ready for payout request." });
    }
    const newPayout = new Payout({
      name: `${billingDetails.firstName} ${billingDetails.lastName}`,
      userId: user,
      package,
      price: configureAccount.price,
      platform: configureAccount.platform,
      step: configureAccount.accountType,
      amountSize: configureAccount.accountSize,
      paymentMethod: payment,
      country: billingDetails.country,
      phone: billingDetails.phone,
      mail: billingDetails.mail,
      billingDetails: {
        title: billingDetails.title,
        postalCode: billingDetails.postalCode,
        country: billingDetails.country,
        city: billingDetails.city,
        street: billingDetails.street,
        dateOfBirth: billingDetails?.dateOfBirth,
      },
    });
    const savedOrder = await newPayout.save();
    res.status(200).json({ allAccountsPayout: accountsPayout });
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
  singleUserData,
  getAccountInPayoutRequest,
  PayoutRequest,
};
