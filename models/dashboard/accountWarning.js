// models/dashboard/accountWarning.js
const mongoose = require("mongoose");
const AccountWarningSchema = new mongoose.Schema(
  {
    tradingAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradingAccount",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "WEEKEND_HOLD",       // open trades over weekend
        "DAILY_DRAWDOWN",     // daily DD limit hit
        "MAX_DRAWDOWN",       // total DD limit hit
        "BALANCE_BREACH",     // balance fell below max-loss floor
        "NEWS_TRADING",       // trade opened/held through high-impact news
        "LOT_SIZE",           // lot size exceeds configured max
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "breach"],
      default: "warning",
      index: true,
    },

    // ── Human-readable content ───────────────────────────────────────────────
    title:   { type: String, required: true },
    message: { type: String, required: true },

    // ── Snapshot of relevant numbers at the time of detection ────────────────
    snapshot: { type: mongoose.Schema.Types.Mixed, default: {} },

    // ── State ────────────────────────────────────────────────────────────────
    acknowledged: { type: Boolean, default: false },
    resolvedAt:   { type: Date, default: null },

    dedupKey: { type: String, index: true },
  },
  { timestamps: true }
);

AccountWarningSchema.index(
  { tradingAccount: 1, type: 1, dedupKey: 1 },
  { unique: true, sparse: true }
);

module.exports =
  mongoose.models.AccountWarning ||
  mongoose.model("AccountWarning", AccountWarningSchema);