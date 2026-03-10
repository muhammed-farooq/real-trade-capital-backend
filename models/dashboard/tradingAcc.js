const mongoose = require("mongoose");

const ChallengeConfigSchema = new mongoose.Schema({
  maxDailyLoss:   { type: Number, default: -5  },   // e.g. -5  (%)
  maxTotalLoss:   { type: Number, default: -10 },   // e.g. -10 (%)
  profitTarget:   { type: Number, default: 10  },   // e.g. 10  (%)
  minTradingDays: { type: Number, default: 10  },
  maxLotSize:     { type: Number, default: 5   },
}, { _id: false });

const TradingAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    index: true,
  },

  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    index: true,
  },

  // ── Credentials (filled by user after payment, when connecting MT account) ──
  login:    { type: String },   // MT4/MT5 login number
  leverage: { type: Number },   // e.g. 100
  startingBalance: { type: Number, required: true }, // = accountSize from order

  challengeConfig: { type: ChallengeConfigSchema, default: () => ({}) },

  // ── Live data (synced from MyfxBook get-my-accounts) ──────────────────────
  name:           { type: String },
  balance:        { type: Number, default: 0 },
  equity:         { type: Number, default: 0 },
  profit:         { type: Number, default: 0 },
  gain:           { type: Number, default: 0 },
  absGain:        { type: Number, default: 0 },
  daily:          { type: Number, default: 0 },
  monthly:        { type: Number, default: 0 },
  drawdown:       { type: Number, default: 0 },
  deposits:       { type: Number, default: 0 },
  withdrawals:    { type: Number, default: 0 },
  currency:       { type: String, default: "USD" },
  profitFactor:   { type: Number, default: 0 },
  pips:           { type: Number, default: 0 },
  demo:           { type: Boolean, default: false },
  server:         { type: String },
  lastUpdateDate: { type: String },

  // ── Computed / tracked by us ───────────────────────────────────────────────
  floatingPnl:          { type: Number, default: 0 },
  dailyHighBalance:     { type: Number, default: 0 },
  dailyHighBalanceDate: { type: Date },

  // ── Sync metadata ──────────────────────────────────────────────────────────
  lastSync:  { type: Date },
  status:    { type: String, enum: ["active", "failed", "pending"], default: "pending" },
  syncError: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("tradingAccount", TradingAccountSchema);