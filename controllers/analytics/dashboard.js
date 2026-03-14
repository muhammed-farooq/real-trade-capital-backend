// controllers/dashboard/dashboardController.js
const TradingAccount = require("../../models/dashboard/tradingAccount");
const OpenTrade      = require("../../models/dashboard/openTrade");
const TradeHistory   = require("../../models/dashboard/tradeHistory");
const DailyGain      = require("../../models/dashboard/dailyGain");
const DataDaily      = require("../../models/dashboard/dataDaily");
const AccountWarning = require("../../models/dashboard/accountWarning");
const { default: mongoose } = require("mongoose");

/* ─────────────────────────────────────────────────────────────────
   GET /trading-acc/:id
───────────────────────────────────────────────────────────────── */
const fetchTradingAcc = async (req, res) => {
  try {
    const { id } = req.params;

    const tradingAccount = await TradingAccount.findOne({ account: id }).lean();
    if (!tradingAccount) {
      return res.status(200).json({ success: false, message: "Trading account not found" });
    }

    // 3 indexed queries — that's the entire DB cost of this endpoint now
    const [openTrades, openOrders, closedTrades] = await Promise.all([
      OpenTrade.find({ tradingAccount: tradingAccount._id, isPending: false }).lean(),
      OpenTrade.find({ tradingAccount: tradingAccount._id, isPending: true  }).lean(),
      TradeHistory.find({ tradingAccount: tradingAccount._id })
        .sort({ closeTime: -1 })
        .limit(50)
        .lean(),
    ]);

    const cfg = tradingAccount.challengeConfig ?? {};

    const account = {
      login:           tradingAccount.login,
      server:          tradingAccount.server,
      leverage:        tradingAccount.leverage,
      currency:        tradingAccount.currency,
      demo:            tradingAccount.demo,
      balance:         tradingAccount.balance,
      equity:          tradingAccount.equity,
      equityPercent:   tradingAccount.equityPercent,
      startingBalance: tradingAccount.startingBalance,
      floatingPnl:     tradingAccount.floatingPnl,
      profit:          tradingAccount.profit,
      gain:            tradingAccount.gain,
      absGain:         tradingAccount.absGain,
      daily:           tradingAccount.daily,
      monthly:         tradingAccount.monthly,
      pips:            tradingAccount.pips,
      profitFactor:    tradingAccount.profitFactor,
      deposits:        tradingAccount.deposits,
      withdrawals:     tradingAccount.withdrawals,
      interest:        tradingAccount.interest,
      commission:      tradingAccount.commission,
      drawdown:        tradingAccount.drawdown,
      dailyHighBalance:  tradingAccount.dailyHighBalance,
      dailyDrawdownUsed: tradingAccount.rules?.dailyDrawdownUsed ?? 0,
      maxDrawdownUsed:   tradingAccount.rules?.maxDrawdownUsed   ?? 0,
      status:          tradingAccount.status,
      lastSync:        tradingAccount.lastSync,
      lastUpdateDate:  tradingAccount.lastUpdateDate,
      firstTradeDate:  tradingAccount.firstTradeDate,
      creationDate:    tradingAccount.creationDate,
    };

    const stats = {
      ...tradingAccount.stats,
      profitFactor:   tradingAccount.profitFactor ?? 0,
      minTradingDays: cfg.minTradingDays ?? 10,
    };

    const rules = {
      ...tradingAccount.rules,
      maxDailyLoss:   cfg.maxDailyLoss   ?? 5,
      maxTotalLoss:   cfg.maxTotalLoss   ?? 10,
      profitTarget:   cfg.profitTarget   ?? 10,
      minTradingDays: cfg.minTradingDays ?? 10,
      maxLotSize:     cfg.maxLotSize     ?? 5,
    };

    return res.status(200).json({
      success: true,
      result: { account, stats, rules, openTrades, openOrders, closedTrades, tradeHistory: closedTrades },
    });
  } catch (error) {
    console.error("[fetchTradingAcc] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /dashboard/gain/:id
───────────────────────────────────────────────────────────────── */
const fetchDailyGain = async (req, res) => {
  try {
    const { id } = req.params;
    const days   = parseInt(req.query.days) || 90;

    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 }).lean();
    if (!tradingAccount) {
      return res.status(200).json({ success: false, message: "Trading account not found" });
    }

    const rows = await DailyGain.find({ tradingAccount: tradingAccount._id })
      .sort({ _id: -1 }).limit(days).lean();

    return res.status(200).json({ success: true, result: rows.reverse() });
  } catch (error) {
    console.error("[fetchDailyGain] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /dashboard/balance/:id
───────────────────────────────────────────────────────────────── */
const fetchDataDaily = async (req, res) => {
  try {
    const { id } = req.params;
    const days   = parseInt(req.query.days) || 90;

    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 }).lean();
    if (!tradingAccount) {
      return res.status(200).json({ success: false, message: "Trading account not found" });
    }

    const rows = await DataDaily.find({ tradingAccount: tradingAccount._id })
      .sort({ _id: -1 }).limit(days).lean();

    return res.status(200).json({ success: true, result: rows.reverse() });
  } catch (error) {
    console.error("[fetchDataDaily] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /dashboard/history/:id
───────────────────────────────────────────────────────────────── */
const fetchTradeHistory = async (req, res) => {
  try {
    const { id }  = req.params;
    const page    = parseInt(req.query.page)  || 1;
    const limit   = parseInt(req.query.limit) || 20;
    const skip    = (page - 1) * limit;

    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 }).lean();
    if (!tradingAccount) {
      return res.status(200).json({ success: false, message: "Trading account not found" });
    }

    const [trades, total] = await Promise.all([
      TradeHistory.find({ tradingAccount: tradingAccount._id })
        .sort({ closeTime: -1 }).skip(skip).limit(limit).lean(),
      TradeHistory.countDocuments({ tradingAccount: tradingAccount._id }),
    ]);

    return res.status(200).json({
      success: true,
      result: { trades, total, page, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[fetchTradeHistory] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAccountWarnings = async (req, res) => {
  try {
    const { id } = req.params;
 
    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 }).lean();
    if (!tradingAccount) {
      return res.status(200).json({ success: false, message: "Trading account not found" });
    }
 
    const { severity, type, unacknowledged } = req.query;
 
    const filter = { tradingAccount: tradingAccount._id };
    if (severity)                  filter.severity     = severity;
    if (type)                      filter.type         = type;
    if (unacknowledged === "true") filter.acknowledged = false;
 
    const [warnings, summaryArr] = await Promise.all([
      AccountWarning
        .find(filter)
        .sort({ createdAt: -1 })
        .select("-__v")
        .lean(),
 
      AccountWarning.aggregate([
        { $match: { tradingAccount: tradingAccount._id } },
        {
          $group: {
            _id:            null,
            total:          { $sum: 1 },
            breaches:       { $sum: { $cond: [{ $eq: ["$severity", "breach"]  }, 1, 0] } },
            warnings:       { $sum: { $cond: [{ $eq: ["$severity", "warning"] }, 1, 0] } },
            unacknowledged: { $sum: { $cond: [{ $eq: ["$acknowledged", false] }, 1, 0] } },
          },
        },
      ]),
    ]);
 
    const summary = summaryArr[0] ?? { total: 0, breaches: 0, warnings: 0, unacknowledged: 0 };
 
    return res.status(200).json({
      success:       true,
      accountStatus: tradingAccount.status,
      summary,
      warnings,
    });
 
  } catch (err) {
    console.error("[getAccountWarnings]", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
const acknowledgeWarnings = async (req, res) => {
  try {
    const { id } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid account id" });
    }
 
    let tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 }).lean();
    if (!tradingAccount) {
      tradingAccount = await TradingAccount.findById(id, { _id: 1 }).lean();
    }
    if (!tradingAccount) {
      return res.status(200).json({ success: false, message: "Trading account not found" });
    }
 
    const { warningIds, acknowledgeAll } = req.body;
    let result;
 
    if (acknowledgeAll) {
      result = await AccountWarning.updateMany(
        { tradingAccount: tradingAccount._id, acknowledged: false },
        { $set: { acknowledged: true } }
      );
    } else {
      if (!Array.isArray(warningIds) || !warningIds.length) {
        return res.status(400).json({
          success: false,
          message: "Provide warningIds array or { acknowledgeAll: true }",
        });
      }
      result = await AccountWarning.updateMany(
        { _id: { $in: warningIds }, tradingAccount: tradingAccount._id },
        { $set: { acknowledged: true } }
      );
    }
 
    return res.status(200).json({ success: true, updated: result.modifiedCount });
 
  } catch (err) {
    console.error("[acknowledgeWarnings]", err.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { 
  fetchTradingAcc, 
  fetchDailyGain, 
  fetchDataDaily, 
  fetchTradeHistory, 
  getAccountWarnings,
  acknowledgeWarnings
};