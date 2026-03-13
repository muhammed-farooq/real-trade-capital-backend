// models/TradingAccount.js
const mongoose = require("mongoose");

const ChallengeConfigSchema = new mongoose.Schema({
  maxDailyLoss:   { type: Number, default: 5  },
  maxTotalLoss:   { type: Number, default: 10 },
  profitTarget:   { type: Number, default: 10 },
  minTradingDays: { type: Number, default: 10 },
  maxLotSize:     { type: Number, default: 5  },
}, { _id: false });

const StatsSchema = new mongoose.Schema({
  totalTrades:  { type: Number, default: 0 },
  winTrades:    { type: Number, default: 0 },
  lossTrades:   { type: Number, default: 0 },
  winRate:      { type: Number, default: 0 },
  avgWin:       { type: Number, default: 0 },
  avgLoss:      { type: Number, default: 0 },
  bestTrade:    { type: Number, default: 0 },
  worstTrade:   { type: Number, default: 0 },
  tradingDays:  { type: Number, default: 0 },
}, { _id: false });

const RulesSchema = new mongoose.Schema({
  currentDailyLoss:   { type: Number, default: 0 },
  dailyLossPassed:    { type: Boolean, default: true },
  currentTotalLoss:   { type: Number, default: 0 },
  totalLossPassed:    { type: Boolean, default: true },
  currentProfit:      { type: Number, default: 0 },
  profitTargetPassed: { type: Boolean, default: false },
  currentTradingDays: { type: Number, default: 0 },
  tradingDaysPassed:  { type: Boolean, default: false },
  currentMaxLot:      { type: Number, default: 0 },
  lotSizePassed:      { type: Boolean, default: true },
  dailyDrawdownUsed:  { type: Number, default: 0 },
  maxDrawdownUsed:    { type: Number, default: 0 },
}, { _id: false });

const TradingAccountSchema = new mongoose.Schema({

  // ── Owner & references ────────────────────────────────────────────────────
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: "Order",   index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "account", index: true },

  // ── MT credentials ────────────────────────────────────────────────────────
  login:           { type: String },
  leverage:        { type: String, default: "100" },
  startingBalance: { type: Number, required: true },

  // ── Challenge config ──────────────────────────────────────────────────────
  challengeConfig: { type: ChallengeConfigSchema, default: () => ({}) },

  // ── MyfxBook identifiers ──────────────────────────────────────────────────
  myfxbookId: { type: Number },

  // ── Live data (synced from get-my-accounts) ───────────────────────────────
  name:           { type: String },
  balance:        { type: Number, default: 0 },
  equity:         { type: Number, default: 0 },
  equityPercent:  { type: Number, default: 0 },
  profit:         { type: Number, default: 0 },
  gain:           { type: Number, default: 0 },
  absGain:        { type: Number, default: 0 },
  daily:          { type: Number, default: 0 },
  monthly:        { type: Number, default: 0 },
  drawdown:       { type: Number, default: 0 },
  deposits:       { type: Number, default: 0 },
  withdrawals:    { type: Number, default: 0 },
  interest:       { type: Number, default: 0 },
  commission:     { type: Number, default: 0 },
  currency:       { type: String,  default: "USD" },
  profitFactor:   { type: Number, default: 0 },
  pips:           { type: Number, default: 0 },
  demo:           { type: Boolean, default: false },
  server:         { type: String },
  lastUpdateDate: { type: String },
  creationDate:   { type: String },
  firstTradeDate: { type: String },

  // ── Computed / tracked ────────────────────────────────────────────────────
  floatingPnl:          { type: Number, default: 0 },
  dailyHighBalance:     { type: Number, default: 0 },
  dailyHighBalanceDate: { type: Date },

  // ── Pre-computed stats & rules (updated by cron, read by API) ────────────
  stats: { type: StatsSchema, default: () => ({}) },
  rules: { type: RulesSchema, default: () => ({}) },

  // ── Sync metadata ─────────────────────────────────────────────────────────
  lastSync:  { type: Date },
  status:    { type: String, enum: ["active", "failed", "pending", "completed"], default: "pending" },
  syncError: { type: String },

}, { timestamps: true });

TradingAccountSchema.index({ account: 1 });
TradingAccountSchema.index({ status: 1, login: 1 });
TradingAccountSchema.index({ myfxbookId: 1 });
TradingAccountSchema.index({ userId: 1 });

module.exports = mongoose.model("tradingAccount", TradingAccountSchema);