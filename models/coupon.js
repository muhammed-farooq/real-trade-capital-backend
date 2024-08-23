const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    userId: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }], // Array of users who used the coupon
    couponCode: {
      type: String,
      required: true,
      trim: true,
      unique: true, 
    },
    couponOffer: {
      type: Number,
      required: true,
    },
    isStopped: {
      type: Boolean,
      default: false,
    },
    discountType: {
      type: String,
      enum: ["percentage", "amount"],
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model("Coupon", couponSchema);
module.exports = Coupon;
