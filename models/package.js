const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({
  PackageType: {
    type: String,
    enum: ["evaluation", "instant"],
    default: "evaluation",
  },
  evaluationStage: {
    PhaseOne: {
      TradingPeriod:      { type: String },
      MinimumTradingDays: { type: String },
      MaximumDailyLoss:   { type: String },
      MaximumLoss:        { type: String },
      ProfitTarget:       { type: String },
      Leverage:           { type: String, default: "100" },
      MaxLotSize:         { type: String, default: "0" },
    },
    PhaseTwo: {
      TradingPeriod:      { type: String },
      MinimumTradingDays: { type: String },
      MaximumDailyLoss:   { type: String },
      MaximumLoss:        { type: String },
      ProfitTarget:       { type: String },
      Leverage:           { type: String, default: "100" },
      MaxLotSize:         { type: String, default: "0" },
    },
  },

  fundedStage: {
    TradingPeriod:      { type: String, required: true },
    MinimumTradingDays: { type: String, required: true },
    MaximumDailyLoss:   { type: String, required: true },
    MaximumLoss:        { type: String, required: true },
    ProfitTarget:       { type: String, required: true },
    Leverage:           { type: String, default: "100" },
    PayoutsProfitSplit: { type: String, required: true },
    MaxLotSize:         { type: String, default: "5" },
  },

  Step: {
    type: Number,
    required: true,   // Instant funding = Step 0
  },
  Validity: {
    type: Number,
    default: null,
  },

  AccountSize: [
    {
      price: { type: Number, default: 0, required: true },
      size:  { type: Number, default: 0, required: true },
    },
  ],
});

const PackageModel = mongoose.model("package", PackageSchema);
module.exports = PackageModel;  