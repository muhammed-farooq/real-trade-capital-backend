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
      set: (v) => parseFloat(v.toFixed(2)),
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
      default: 5,
    },
    affiliate_paidOut: {
      type: Number,
      set: (v) => parseFloat(v.toFixed(2)),
    },
    affiliate_earned: {
      type: Number,
      set: (v) => parseFloat(v.toFixed(2)),
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
          lowercase: true,
          trim: true,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        amountSize: {
          type: Number,
          set: (v) => parseFloat(v.toFixed(2)),
        },
        earned: {
          type: Number,
          set: (v) => parseFloat(v.toFixed(2)),
        },
      },
    ],
    walletHistory: [
      {
        date: {
          type: Date,
          default: Date.now,
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
          enum: ["err", "msg", "good", "info"],
          default: "msg",
        },
        content: {
          type: String,
        },
        sendedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPurchased: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Maximum number of notifications
const MAX_NOTIFICATIONS = 15;

// Pre-save middleware to trim notifications array
userSchema.pre("save", function (next) {
  if (this.notifications.length > MAX_NOTIFICATIONS) {
    // Trim the array to the maximum length by removing the oldest entries
    this.notifications = this.notifications.slice(-MAX_NOTIFICATIONS);
  }
  next();
});

const userModel = mongoose.model("users", userSchema);
module.exports = userModel;
