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
    step: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    accountName: {
      type: String,
      required: true,
    },
    reasonForReject: {
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
    requestCancelledAt: { type: Date },
    txnStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    Certificate: {
      type: String,
    },
    Invoice: {
      type: String,
    },
    mail: {
      type: Number,
    },
    amount: {
      type: Number,
      required: true,
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
