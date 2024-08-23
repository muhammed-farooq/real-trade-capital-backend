const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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
    coupon: {
      type: String,
    },
    couponRedusedAmount: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
    platform: {
      type: String,
      required: true,
    },
    txnId: {
      type: String,
    },
    step: {
      type: String,
      required: true,
    },
    amountSize: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    country: {
      type: String,
    },
    orderStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    txnStatus: {
      type: String,
      enum: ["Pending", "Completed", "Cancelled"],
      default: "Pending",
    },
    phone: {
      type: Number,
      required: true,
    },
    mail: {
      type: String,
      required: true,
    },
    isCouponApplied: {
      type: Boolean,
      default: false,
    },
    reasonForCancel: {
      type: String,
    },
    billingDetails: {
      title: {
        type: String,
      },
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
        // required: true,
      },
    },
    orderCancelledAt: {
      type: Date,
      // required: true,
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

const order = mongoose.model("order", orderSchema);
module.exports = order;
