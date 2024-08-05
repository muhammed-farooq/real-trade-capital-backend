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

module.exports = {
  getAccountLists,
};
