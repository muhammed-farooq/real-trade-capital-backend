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
    phase: {
      type: String,
      default: "Phase One",
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    step: {
      type: String,
      required: true,
    },
    PhaseOneCredentials: {
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
    PhaseTwoCredentials: {
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
    accountName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["Not Passed", "Passed", "Pending", "Ongoing"],
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
