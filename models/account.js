const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package",
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    step: {
      type: String,
      required: true,
    },
    accountName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["Not Passed", "Passed", "Pending", "On going"],
      default: "Pending",
    },
    isBanned: { type: Boolean, default: false },
    isVerify: { type: Boolean, default: false },
    isPurchased: { type: Boolean, default: false },
    approvedDate: { type: Date },
  },
  {
    timestamps: true,
  }
);

const Account = mongoose.model("account", accountSchema);
module.exports = Account;