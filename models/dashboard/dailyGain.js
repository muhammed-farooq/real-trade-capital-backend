// models/dashboard/DailyGain.js
// One document per (tradingAccount + date). Upserted on each sync.
const mongoose = require("mongoose");

const DailyGainSchema = new mongoose.Schema({
  tradingAccount: { type: mongoose.Schema.Types.ObjectId, ref: "tradingAccount", required: true, index: true },

  date:   { type: String, required: true },  // "MM/DD/YYYY" from MyfxBook
  value:  { type: Number, default: 0 },      // cumulative gain % on that day
  profit: { type: Number, default: 0 },      // daily profit in $
}, { timestamps: false, versionKey: false });

// One entry per account per day
DailyGainSchema.index({ tradingAccount: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyGain", DailyGainSchema);