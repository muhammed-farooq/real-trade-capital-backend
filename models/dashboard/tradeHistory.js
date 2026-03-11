// models/dashboard/TradeHistory.js
// Upserted — never deleted. Grows over time. Indexed for fast filtering.
const mongoose = require("mongoose");

const TradeHistorySchema = new mongoose.Schema({
  tradingAccount: { type: mongoose.Schema.Types.ObjectId, ref: "tradingAccount", required: true, index: true },

  symbol:     { type: String },
  action:     { type: String },
  lots:       { type: Number, default: 0 },
  openPrice:  { type: Number, default: 0 },
  closePrice: { type: Number, default: 0 },
  tp:         { type: Number, default: 0 },
  sl:         { type: Number, default: 0 },
  profit:     { type: Number, default: 0 },
  pips:       { type: Number, default: 0 },
  swap:       { type: Number, default: 0 },
  commission: { type: Number, default: 0 },
  comment:    { type: String, default: "" },
  openTime:   { type: String, index: true },
  closeTime:  { type: String, index: true },
}, { timestamps: false, versionKey: false });

// Compound unique index — prevents duplicate history entries on re-sync
TradeHistorySchema.index(
  { tradingAccount: 1, openTime: 1, closeTime: 1, symbol: 1, action: 1 },
  { unique: true }
);

// Paginated history fetch — sort by closeTime desc
TradeHistorySchema.index({ tradingAccount: 1, closeTime: -1 });

module.exports = mongoose.model("TradeHistory", TradeHistorySchema);