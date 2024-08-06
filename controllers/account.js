const Account = require("../models/account");

const getAccountLists = async (req, res) => {
  try {
    const userId = req.params.id;
    const accounts = await Account.find({ userId }).sort({ createdAt: -1 });

    // if (!accounts.length) {
    //   return res
    //     .status(404)
    //     .json({ message: "No accounts found for this user." });
    // }

    res.status(200).json({ allAccounts: accounts });
  } catch (error) {
    console.error("Error fetching account lists:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllTheRequests = async (req, res) => {
  try {
    const accounts = await Account.find({ toNextStep: true })
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
      return res.status(404).json({ message: "Account not found." });
    }
    if (!account.status == "Ongoing") {
      return res
        .status(404)
        .json({ message: `Account status is ${account.status}.` });
    }
    if (account.toNextStep) {
      return res.status(201).json({ message: `You requested all ready` });
    }

    if (account.step === "stepOne") {
      if (account.phase === "Phase One") {
        account.nextStep = "Funded";
      } else if (account.phase === "Funded") {
        return res.status(201).json({ info: "Account all ready it's peak" });
      }
    } else if (account.step === "stepTwo") {
      if (account.phase === "Phase One") {
        account.nextStep = "Phase Two";
      } else if (account.phase === "Phase Two") {
        account.nextStep = "Funded";
      } else if (account.phase === "Funded") {
        return res.status(201).json({ info: "Account all ready it's peak" });
      }
    }
    account.toNextStep = true;
    account.requestedOn = new Date();
    await account.save();
    res.status(200).json({ account, msg: "Request sended successfully" });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ message: "Server error" });
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
      account.phase ="Phase Two"
    }else if(account.nextStep == "Funded") {
      account.PhaseTwoCredentials = {
        email,
        username,
        password: hashedPassword,
        server,
        platform,
      };
      account.phase ="Funded"
      account.status = "Passed";
      account.passedOn = new Date();
    }
    account.nextStep = "";
    account.toNextStep = false;

    await account.save();
    console.log("Account updated and saved:", account);

    res.status(200).json({ success: true, msg: "Order approved successfully" });
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
};
