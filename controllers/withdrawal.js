const User = require("../models/user");
const Withdrawal = require("../models/withdrawal");

const addWithdrawal = async (req, res) => {
  try {
    const { formValue } = req.body;
    console.log("Payout body:", req.body);

    const { txnId, name, amount, country } = formValue;

    // Check if all required fields are present
    if (!name || !txnId || !amount || !country) {
      return res.status(404).json({ errMsg: "Fill the form" });
    }

    // Validate amount
    const amountNumber = parseFloat(amount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      return res
        .status(400)
        .json({ errMsg: "Amount must be a valid number greater than zero" });
    }

    // Check if the withdrawal already exists
    const withdrawal = await Withdrawal.findOne({ name: name });
    if (withdrawal) {
      console.log(`Withdrawal already exists for this name`);
      return res
        .status(204)
        .json({ errMsg: "Withdrawal with this name already exists" });
    }

    // Create and save the new withdrawal
    const newWithdrawal = new Withdrawal({
      name,
      txnId,
      amount: amountNumber,
      country, // Ensure amount is stored as a number
    });

    const saveWithdrawal = await newWithdrawal.save();
    if (saveWithdrawal) {
      res.status(200).json({
        success: true,
        withdrawal: newWithdrawal,
        msg: "Withdrawal added successfully",
      });
    } else {
      return res.status(500).json({ errMsg: "Failed to add withdrawal" });
    }
  } catch (error) {
    console.error("Error adding withdrawal:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const deleteWithdrawal = async (req, res) => {
  try {
    const Id = req.params.id;

    if (!Id) {
      console.log(`Withdrawal not found for Id: ${Id}`);
      return res.status(404).json({ error: "Withdrawal not found" });
    }
    const withdrawal = await Withdrawal.findByIdAndDelete(Id);

    if (!withdrawal) {
      console.log(`Withdrawal not found for Id: ${Id}`);
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    res.status(200).json({
      success: true,
      withdrawal,
      msg: "Withdrawal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting withdrawal:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

const getAllWithdrawals = async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find().sort({ createdAt: -1 }); // Fetch all withdrawals

    if (!withdrawals || withdrawals.length === 0) {
      return res.status(404).json({ error: "No withdrawals found" });
    }

    res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

module.exports = {
  addWithdrawal,
  deleteWithdrawal,
  getAllWithdrawals,
};
