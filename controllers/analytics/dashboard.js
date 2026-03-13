// controllers/dashboard/dashboardController.js
const TradingAccount = require("../../models/dashboard/tradingAcc");
const OpenTrade      = require("../../models/dashboard/openTrade");
const TradeHistory   = require("../../models/dashboard/tradeHistory");
const DailyGain      = require("../../models/dashboard/dailyGain");
const DataDaily      = require("../../models/dashboard/dataDaily");

/* ─────────────────────────────────────────────────────────────────
   GET /trading-acc/:id
───────────────────────────────────────────────────────────────── */
const fetchTradingAcc = async (req, res) => {
  try {
    const { id } = req.params;

    const tradingAccount = await TradingAccount.findOne({ account: id }).lean();
    if (!tradingAccount) {
      return res.status(404).json({ success: false, message: "Trading account not found" });
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
      return res.status(404).json({ success: false, message: "Trading account not found" });
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
      return res.status(404).json({ success: false, message: "Trading account not found" });
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
      return res.status(404).json({ success: false, message: "Trading account not found" });
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

module.exports = { fetchTradingAcc, fetchDailyGain, fetchDataDaily, fetchTradeHistory };