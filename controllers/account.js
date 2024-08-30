const Account = require("../models/account");
const CryptoJS = require("crypto-js");
const User = require("../models/user");
const { notification } = require("./common");

``;
const encryptPassword = (password) => {
  const secretKey = process.env.PASSWORD_SALT;
  return CryptoJS.AES.encrypt(password, secretKey).toString();
};

const getAccountLists = async (req, res) => {
  try {
    const userId = req.params.id;
    const accounts = await Account.find({ userId }).sort({ createdAt: -1 });

    // if (!accounts.length) {
    //   return res
    //     .status(404)
    //     .json({ msg: "No accounts found for this user." });
    // }
    // console.log(accounts);
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

    if (!account) {
      return res.status(404).json({ errMsg: "Account not found." });
    }
    if (account.status !== "Ongoing") {
      return res
        .status(400)
        .json({ errMsg: `Account status is ${account.status}.` });
    }
    if (account.toNextStep) {
      return res.status(409).json({
        errMsg: `You have already requested to move to the next step.`,
      });
    }

    const currentDate = new Date();
    let minTradingDaysOver = false;

    // Check if minimum trading days are over for the current phase
    if (account.phase === "Phase One") {
      if (currentDate >= account.MinimumTradingDays.PhaseOne) {
        minTradingDaysOver = true;
      }
    } else if (account.phase === "Phase Two") {
      if (currentDate >= account.MinimumTradingDays.PhaseTwo) {
        minTradingDaysOver = true;
      }
    } else if (account.phase === "Funded") {
      return res.status(201).json({ info: "Account is already at its peak." });
    }

    // if (!minTradingDaysOver) {
    //   return res.status(201).json({
    //     info:
    //       "Minimum trading days are not yet completed for the current phase.",
    //   });
    // }
    if (account.step === "stepOne") {
      if (account.phase === "Phase One") {
        account.nextStep = "Funded";
      }
    } else if (account.step === "stepTwo") {
      if (account.phase === "Phase One") {
        account.nextStep = "Phase Two";
      } else if (account.phase === "Phase Two") {
        account.nextStep = "Funded";
      }
    }

    account.toNextStep = true;
    account.requestedOn = new Date();
    await account.save();

    res.status(200).json({ account, msg: "Request sent successfully." });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ msg: "Server error." });
  }
};

const ApproveRequest = async (req, res) => {
  try {
    const { formValue, accountId } = req.body;
    console.log("Request body:", req.body);

    const { username, email, password, server, platform } = formValue;
    const hashedPassword = encryptPassword(password);

    const account = await Account.findOne({ _id: accountId });
    if (!account) {
      console.log(`Account not found for accountId: ${accountId}`);
      return res.status(404).json({ error: "Account not found" });
    }
    console.log(username, email, password, server, platform);
    if (account.nextStep == "Phase Two") {
      account.PhaseTwoCredentials = {
        email,
        username,
        password: hashedPassword,
        server,
        platform,
      };
      account.phase = "Phase Two";
      const phaseTwoMinTradingDays = parseInt(account.MinimumTrading.PhaseTwo);
      const currentDate = new Date();
      account.MinimumTradingDays.PhaseTwo = new Date(
        currentDate.setDate(currentDate.getDate() + phaseTwoMinTradingDays)
      );

      account.toPhaseTwoOn = new Date();
    } else if (account.nextStep == "Funded") {
      account.FundedStageCredentials = {
        email,
        username,
        password: hashedPassword,
        server,
        platform,
      };
      account.phase = "Funded";
      account.status = "Passed";
      account.passedOn = new Date();
      const fundedMinTradingDays = parseInt(account.MinimumTrading.Funded);
      const currentDate = new Date();
      account.MinimumTradingDays.Funded = new Date(
        currentDate.setDate(currentDate.getDate() + fundedMinTradingDays)
      );
    }
    account.nextStep = "";
    account.toNextStep = false;

    const user = await User.findById(account.userId);
    if (!user) {
      console.log(`Account not found for accountId: ${accountId}`);
      return res.status(404).json({ error: "user not found" });
    }
    user.notifications.push(
      notification(
        "/dashboard",
        "good",
        `Your "${account.accountName}" successfully passed to ${account.phase}`
      )
    );
    await account.save();
    await user.save();
    console.log("Account updated and saved:", account);

    res
      .status(200)
      .json({ success: true, msg: "Request approved successfully" });
  } catch (error) {
    console.error("Error approving order:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

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
    await user.save();
    await account.save();
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
