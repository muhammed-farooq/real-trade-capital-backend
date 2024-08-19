const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
    },
    paymentMethod: {
      type: String,
    },
    txnId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    isAffiliate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Processed", "Pending", "Cancelled"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
    capped: {
      size: 102400, // Size in bytes; you can adjust this based on your document size.
      max: 25, // Maximum number of documents.
    },
  }
);

const coupon = mongoose.model("coupon", couponSchema);
module.exports = coupon;
