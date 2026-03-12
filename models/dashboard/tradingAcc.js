// models/TradingAccount.js
const mongoose = require("mongoose");

const ChallengeConfigSchema = new mongoose.Schema({
  maxDailyLoss:   { type: Number, default: 5  },
  maxTotalLoss:   { type: Number, default: 10 },
  profitTarget:   { type: Number, default: 10 },
  minTradingDays: { type: Number, default: 10 },
  maxLotSize:     { type: Number, default: 5  },
}, { _id: false });

const TradingAccountSchema = new mongoose.Schema({

  // ── Owner & references ────────────────────────────────────────────────────
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: "Order",   index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "account", index: true },

  // ── MT credentials (set after payment when user connects account) ─────────
  login:           { type: String },    // MT login = mfxAcc.accountId
  leverage:        { type: String ,default : "100"},    // e.g. 100
  startingBalance: { type: Number, required: true },

  // ── Challenge config (copied from Package at order time) ──────────────────
  challengeConfig: { type: ChallengeConfigSchema, default: () => ({}) },

  // ── MyfxBook identifiers ──────────────────────────────────────────────────
  // MyfxBook has TWO different id fields:
  //   myfxbookId — numeric `id`        e.g. 11533983   → used as ?id= in open-trades, history, daily-gain APIs
  //   login      — numeric `accountId` e.g. 1301016836 → MT login, used to match in get-my-accounts
  myfxbookId: { type: Number },   // mfxAcc.id — store to skip re-fetching all accounts on every call

  // ── Live data (synced from get-my-accounts) ───────────────────────────────
  name:           { type: String },
  balance:        { type: Number, default: 0 },
  equity:         { type: Number, default: 0 },
  equityPercent:  { type: Number, default: 0 },   // mfxAcc.equityPercent
  profit:         { type: Number, default: 0 },
  gain:           { type: Number, default: 0 },
  absGain:        { type: Number, default: 0 },
  daily:          { type: Number, default: 0 },
  monthly:        { type: Number, default: 0 },
  drawdown:       { type: Number, default: 0 },
  deposits:       { type: Number, default: 0 },
  withdrawals:    { type: Number, default: 0 },
  interest:       { type: Number, default: 0 },   // mfxAcc.interest   (swap/rollover earnings)
  commission:     { type: Number, default: 0 },   // mfxAcc.commission (total commissions paid)
  currency:       { type: String,  default: "USD" },
  profitFactor:   { type: Number, default: 0 },
  pips:           { type: Number, default: 0 },
  demo:           { type: Boolean, default: false },
  server:         { type: String },               // mfxAcc.server.name
  lastUpdateDate: { type: String },               // "MM/DD/YYYY HH:mm"
  creationDate:   { type: String },               // mfxAcc.creationDate
  firstTradeDate: { type: String },               // mfxAcc.firstTradeDate — "trading since" label

  // ── Computed / tracked by us ──────────────────────────────────────────────
  floatingPnl:          { type: Number, default: 0 },  // equity - balance
  dailyHighBalance:     { type: Number, default: 0 },  // resets each new calendar day
  dailyHighBalanceDate: { type: Date },

  // ── Sync metadata ─────────────────────────────────────────────────────────
  lastSync:  { type: Date },
  status: { type: String, enum: ["active", "failed", "pending", "completed"], default: "pending" },
  syncError: { type: String },

}, { timestamps: true });

// ── Indexes ───────────────────────────────────────────────────────────────────

// fetchTradingAcc — most frequent query, every API call
TradingAccountSchema.index({ account: 1 });

// syncAllAccounts — runs every 15 min
TradingAccountSchema.index({ status: 1, login: 1 });

// myfxbookId lookup — used in syncOne to match accounts
TradingAccountSchema.index({ myfxbookId: 1 });

// userId — for listing all accounts of a user
TradingAccountSchema.index({ userId: 1 });

module.exports = mongoose.model("tradingAccount", TradingAccountSchema);