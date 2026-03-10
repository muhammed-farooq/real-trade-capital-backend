// models/dashboard/OpenTrade.js
// Replaced on every sync (delete + insertMany) — these change every 15 min
const mongoose = require("mongoose");

const OpenTradeSchema = new mongoose.Schema({
  tradingAccount: { type: mongoose.Schema.Types.ObjectId, ref: "tradingAccount", required: true, index: true },

  symbol:    { type: String },
  action:    { type: String },   // "Buy" | "Sell"
  lots:      { type: Number, default: 0 },
  openPrice: { type: Number, default: 0 },
  tp:        { type: Number, default: 0 },
  sl:        { type: Number, default: 0 },
  profit:    { type: Number, default: 0 },
  pips:      { type: Number, default: 0 },
  swap:      { type: Number, default: 0 },
  comment:   { type: String, default: "" },
  openTime:  { type: String },
  isPending: { type: Boolean, default: false },  // true = open order (limit/stop), false = live trade
}, { timestamps: false, versionKey: false });

module.exports = mongoose.model("openTrade", OpenTradeSchema);