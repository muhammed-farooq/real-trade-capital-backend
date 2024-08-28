const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
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
      postalCode: {
        type: Number,
      },
      country: {
        type: String,
      },
      city: {
        type: String,
      },
      street: {
        type: String,
      },
    },
    dateOfBirth: {
      type: Date,
    },
    isAdmin: {
      type: Boolean,
    },
    wallet: {
      type: Number,
      default: 0,
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
      default: "5",
    },
    affiliate_paidOut: {
      type: Number,
    },
    affiliate_earned: {
      type: Number,
    },
    parent_affiliate: {
      type: String,
    },
    withdrawIng: {
      type: Boolean,
      default: false,
    },
    my_referrals: [
      {
        user: {
          type: String,
          unique: true,
          lowercase: true,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now(),
        },
        amountSize: {
          type: Number,
        },
        earned: {
          type: Number,
        },
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
        path: {
          type: String,
        },
        type: {
          type: String,
          enum: ["err", "msg","good", "info"],
          default: "msg",
        },
        content: {
          type: String,
        },
        sendedAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    isPurchased: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
