const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    screenshot: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "package",
      required: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: true,
    },
    request: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    step: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    txnStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    eventDate: {
      type: Date,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    mail: {
      type: Number,
      required: true,
    },
    isCouponApplied: {
      type: Boolean,
      default: false,
    },
    billingDetails: {
      postalCode: {
        type: Number,
        required: true,
      },
      country: {
        type: String,
      },
      city: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      dateOfBirth: {
        type: Date,
        required: true,
      },
    },
    orderCreatedAt: {
      type: Date,
      default: Date.now(),
    },
  },
  {
    timestamps: true,
  }
);

const payout = mongoose.model("payout", payoutSchema);
module.exports = payout;
