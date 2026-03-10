// models/dashboard/DataDaily.js
// One document per (tradingAccount + date). Balance curve data. Upserted on each sync.
const mongoose = require("mongoose");

const DataDailySchema = new mongoose.Schema({
  tradingAccount: { type: mongoose.Schema.Types.ObjectId, ref: "tradingAccount", required: true, index: true },

  date:    { type: String, required: true },  // "MM/DD/YYYY" from MyfxBook
  balance: { type: Number, default: 0 },
  profit:  { type: Number, default: 0 },      // daily P&L
  pips:    { type: Number, default: 0 },
  lots:    { type: Number, default: 0 },
}, { timestamps: false, versionKey: false });

// One entry per account per day
DataDailySchema.index({ tradingAccount: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DataDaily", DataDailySchema);