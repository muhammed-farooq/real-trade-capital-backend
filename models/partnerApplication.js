const mongoose = require("mongoose");

const partnerApplicationSchema = new mongoose.Schema(
  {
    // Link back to the applicant
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    affiliate_id: {
      type: String,
      required: true,
    },

    // ── Form fields ──
    promotionMethod: {
      type: String,
      required: true,
      enum: [
        "youtube",
        "telegram",
        "instagram",
        "tiktok",
        "twitter",
        "discord",
        "website_blog",
        "paid_ads",
        "other",
      ],
    },
    audienceSize: {
      type: String,
      required: true,
      enum: ["0-500", "500-2000", "2000-10000", "10000-50000", "50000+"],
    },
    experience: {
      type: String,
      required: true,
      enum: ["none", "under_1", "1-3", "3-5", "5+"],
    },
    expectedReferrals: {
      type: Number,
      required: true,
      min: 0,
    },
    socialLinks: {
      type: String,
      trim: true,
    },
    motivation: {
      type: String,
      trim: true,
    },

    // ── Review lifecycle ──
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: String
    },
    reviewedAt: {
      type: Date,
    },
    adminNote: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent a user from having more than one open application
partnerApplicationSchema.index(
  { user: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

const partnerApplicationModel = mongoose.model(
  "partnerApplications",
  partnerApplicationSchema
);
module.exports = partnerApplicationModel;