const mongoose = require("mongoose");

const PackageSchema = new mongoose.Schema({
  evaluationStage: {
    PhaseOne: {
      TradingPeriod: {
        type: String,
        required: true,
      },
      MinimumTradingDays: {
        type: String,
        required: true,
      },
      MaximumDailyLoss: {
        type: String,
        required: true,
      },
      MaximumLoss: {
        type: String,
        required: true,
      },
      ProfitTarget: {
        type: String,
        required: true,
      },
      Leverage: {
        type: String,
        required: true,
      },
    },
    PhaseTwo: {
      TradingPeriod: {
        type: String,
        required: true,
      },
      MinimumTradingDays: {
        type: String,
        required: true,
      },
      MaximumDailyLoss: {
        type: String,
        required: true,
      },
      MaximumLoss: {
        type: String,
        required: true,
      },
      ProfitTarget: {
        type: String,
        required: true,
      },
      Leverage: {
        type: String,
        required: true,
      },
    },
  },
  fundedStage: {
    TradingPeriod: {
      type: String,
      required: true,
    },
    MaximumDailyLoss: {
      type: String,
      required: true,
    },
    MaximumLoss: {
      type: String,
      required: true,
    },
    ProfitTarget: {
      type: String,
      required: true,
    },
    Leverage: {
      type: String,
      required: true,
    },
    PayoutsProfitSplit: {
      type: String,
      required: true,
    },
  },

  Step: {
    type: Number,
    required: true,
  },
  AccountSize: [
    {
      price: {
        type: Number,
        default: 0,
        required: true,
      },
      size: {
        type: Number,
        default: 0,
        required: true,
      },
    },
  ],
});

const PackageModel = mongoose.model("package", PackageSchema);
module.exports = PackageModel;
