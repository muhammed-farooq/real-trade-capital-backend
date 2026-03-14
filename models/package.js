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
        default : "100"
      },
      MaxLotSize: {
        type: String,
        default : "0" //Unlimited
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
        default : "100"
      },
      MaxLotSize: {
        type: String,
        default : "0" //Unlimited
      },
    },
  },
  fundedStage: {
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
      default : "100"
    },
    PayoutsProfitSplit: {
      type: String,
      required: true,
    },
    MaxLotSize: {
      type: String,
       default : "5"  //Limited to 5 Max
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
