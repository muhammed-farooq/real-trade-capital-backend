const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
    },
    TRC20Wallet: {
      type: String,
      required: true,
    },
    step: {
      type: String,
    },
    name: {
      type: String,
    },
    note: {
      type: String,
    },
    FundedStageCredentials: {
      email: {
        type: String,
      },
      username: {
        type: String,
      },
      password: {
        type: String,
      },
      server: {
        type: String,
      },

      platform: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: ["Processed", "Pending", "Cancelled"],
      default: "Pending",
    },
    approvedDate: { type: Date },
    requestedOn: { type: Date },
    payoutCancelledAt: { type: Date },
    txnStatus: {
      type: String,
      enum: ["Pending", "Processed", "Cancelled"],
      default: "Pending",
    },
    Certificate: {
      type: String,
    },
    Invoice: {
      type: String,
    },
    mail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    txnId: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      set: (v) => parseFloat(v.toFixed(2)),
    },
    isAffiliate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const payout = mongoose.model("payout", payoutSchema);
module.exports = payout;
