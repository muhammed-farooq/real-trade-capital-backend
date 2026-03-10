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

  userId:  { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true, index: true },
  order:   { type: mongoose.Schema.Types.ObjectId, ref: "Order",   index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: "account", index: true },

  login:           { type: String },    
  leverage:        { type: Number },   
  startingBalance: { type: Number, required: true },

  challengeConfig: { type: ChallengeConfigSchema, default: () => ({}) },

  myfxbookId: { type: Number }, 

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

  floatingPnl:          { type: Number, default: 0 },  // equity - balance
  dailyHighBalance:     { type: Number, default: 0 },  // resets each new calendar day
  dailyHighBalanceDate: { type: Date },

  lastSync:  { type: Date },
  status:    { type: String, enum: ["active", "failed", "pending"], default: "pending" },
  syncError: { type: String },

}, { timestamps: true });

module.exports = mongoose.model("tradingAccount", TradingAccountSchema);