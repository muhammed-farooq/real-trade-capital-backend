const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: Number,
    },
    password: {
      type: String,
      trim: true,
      required: true,
      minlength: [6],
    },
    address: {
      street: {
        type: String,
      },
      postalCode: {
        type: String,
      },
      city: {
        type: String,
      },
      country: {
        type: String,
      },
    },
    wallet: {
      type: Number,
      default: 0,
    },
    isAdmin: {
      type: Boolean,
    },
    affiliate_id: {
      type: String,
      required: true,
    },
    is_affiliate: {
      type: Boolean,
    },
    affiliate_share: {
      type: Number,
    },
    parent_affiliate: {
      type: String,
      required: true,
    },
    my_referrals: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
    ],
    walletHistory: [
      {
        date: {
          type: Date,
          default: Date.now(),
        },
        amount: {
          type: Number,
          default: 0,
        },
        from: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "provider",
        },
        transactionType: {
          type: String,
          enum: ["Credit", "Debit"],
        },
      },
    ],
    isBanned: { type: Boolean, default: false },
    isVerify: { type: Boolean, default: false },
    notifications: [
      {
        from: {
          type: String,
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        sendedAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    isPurchased:{ type: Boolean, default: false }
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
