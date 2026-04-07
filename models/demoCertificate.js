const mongoose = require("mongoose");

const demoCertificateSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["account", "payout"],
      required: true,
    },

    // Common
    name: { type: String, required: true },
    issuedOn: { type: Date, required: true },
    isDemo: { type: Boolean, default: true },

    // Account-type fields
    accountName: { type: String }, // used as the verify lookup key
    phase: { type: String },       // "Phase One", "Phase Two", "Funded"
    platform: { type: String },
    amountSize: { type: Number },
    status: {
      type: String,
      default: "Passed",
    },

    // Payout-type fields
    payoutAmount: { type: Number },
    paymentMethod: { type: String },
    payoutPlatform: { type: String },

    note: { type: String },
  },
  {
    timestamps: true,
  }
);

// Index for fast verify lookups
demoCertificateSchema.index({ accountName: 1 });
demoCertificateSchema.index({ _id: 1, type: 1 });

const DemoCertificate = mongoose.model("demoCertificate", demoCertificateSchema);
module.exports = DemoCertificate;