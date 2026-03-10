// controllers/dashboard/dashboardController.js
const TradingAccount = require("../../models/dashboard/tradingAcc");
const OpenTrade      = require("../../models/dashboard/openTrade");
const TradeHistory   = require("../../models/dashboard/tradeHistory");
const DailyGain      = require("../../models/dashboard/dailyGain");
const DataDaily      = require("../../models/dashboard/dataDaily");


/* ─────────────────────────────────────────────────────────────────
   GET /trading-acc/:id
   id = Account._id (prop firm account doc)

   Returns full dashboard data:
   { account, stats, rules, openTrades, openOrders, closedTrades, tradeHistory }

   Sync is handled by a separate background cron — no sync here.
───────────────────────────────────────────────────────────────── */
const fetchTradingAcc = async (req, res) => {
  try {
    const { id } = req.params;

    const tradingAccount = await TradingAccount.findOne({ account: id });
    if (!tradingAccount) {
      return res.status(404).json({ success: false, message: "Trading account not found" });
    }

    // Fetch trades from separate collections
    const [openTrades, openOrders, closedTrades] = await Promise.all([
      OpenTrade.find({ tradingAccount: tradingAccount._id, isPending: false }).lean(),
      OpenTrade.find({ tradingAccount: tradingAccount._id, isPending: true  }).lean(),
      TradeHistory.find({ tradingAccount: tradingAccount._id })
        .sort({ closeTime: -1 })
        .limit(50)
        .lean(),
    ]);

    // ── Compute stats from trade history ─────────────────────────────────────
    const allClosed   = await TradeHistory.find({ tradingAccount: tradingAccount._id }).lean();
    const wins        = allClosed.filter((t) => t.profit > 0);
    const losses      = allClosed.filter((t) => t.profit < 0);
    const winRate     = allClosed.length ? (wins.length / allClosed.length) * 100 : 0;
    const avgWin      = wins.length   ? wins.reduce((s, t) => s + t.profit, 0)   / wins.length   : 0;
    const avgLoss     = losses.length ? losses.reduce((s, t) => s + t.profit, 0) / losses.length : 0;
    const bestTrade   = allClosed.length ? Math.max(...allClosed.map((t) => t.profit)) : 0;
    const worstTrade  = allClosed.length ? Math.min(...allClosed.map((t) => t.profit)) : 0;

    // Unique trading days = unique dates from closeTimes
    const tradingDays = new Set(
      allClosed.map((t) => t.closeTime?.split(" ")[0]).filter(Boolean)
    ).size;

    const stats = {
      totalTrades:    allClosed.length,
      winTrades:      wins.length,
      lossTrades:     losses.length,
      winRate:        parseFloat(winRate.toFixed(2)),
      avgWin:         parseFloat(avgWin.toFixed(2)),
      avgLoss:        parseFloat(avgLoss.toFixed(2)),
      bestTrade:      parseFloat(bestTrade.toFixed(2)),
      worstTrade:     parseFloat(worstTrade.toFixed(2)),
      profitFactor:   tradingAccount.profitFactor ?? 0,
      tradingDays,
      minTradingDays: tradingAccount.challengeConfig?.minTradingDays ?? 10,
    };

    // ── Compute challenge rule status ─────────────────────────────────────────
    const cfg       = tradingAccount.challengeConfig ?? {};
    const startBal  = tradingAccount.startingBalance ?? 0;
    const balance   = tradingAccount.balance ?? 0;
    const dailyHigh = tradingAccount.dailyHighBalance ?? balance;

    // Daily loss: how much balance dropped from today's high, as % of startingBalance
    // Negative means loss. Only relevant if balance < dailyHigh.
    const currentDailyLoss = startBal > 0
      ? parseFloat((((balance - dailyHigh) / startBal) * 100).toFixed(2))
      : 0;

    // Total drawdown: how much below starting balance, as % of startingBalance
    // Only negative values matter — if balance > startBal, drawdown = 0
    const currentTotalDrawdown = startBal > 0
      ? parseFloat((Math.min(0, (balance - startBal) / startBal * 100)).toFixed(2))
      : 0;

    // Current profit: how much above starting balance (always positive or 0 for rules display)
    const currentProfit = startBal > 0
      ? parseFloat(((balance - startBal) / startBal * 100).toFixed(2))
      : 0;

    const currentMaxLot = openTrades.length
      ? Math.max(...openTrades.map((t) => t.lots ?? 0))
      : 0;

    const rules = {
      // Daily drawdown — currentDailyLoss is 0 or negative
      currentDailyLoss:    currentDailyLoss,
      maxDailyLoss:        cfg.maxDailyLoss   ?? 5,
      dailyLossPassed:     Math.abs(currentDailyLoss) <= (cfg.maxDailyLoss ?? 5),

      // Total drawdown — currentTotalDrawdown is 0 or negative
      currentTotalLoss:    currentTotalDrawdown,
      maxTotalLoss:        cfg.maxTotalLoss   ?? 10,
      totalLossPassed:     Math.abs(currentTotalDrawdown) <= (cfg.maxTotalLoss ?? 10),

      // Profit target — currentProfit is positive
      currentProfit:       currentProfit,
      profitTarget:        cfg.profitTarget   ?? 10,
      profitTargetPassed:  currentProfit >= (cfg.profitTarget ?? 10),

      currentTradingDays:  tradingDays,
      minTradingDays:      cfg.minTradingDays ?? 10,
      tradingDaysPassed:   tradingDays >= (cfg.minTradingDays ?? 10),

      currentMaxLot:       parseFloat(currentMaxLot.toFixed(2)),
      maxLotSize:          cfg.maxLotSize     ?? 5,
      lotSizePassed:       currentMaxLot <= (cfg.maxLotSize ?? 5),
    };

    // ── Account summary ───────────────────────────────────────────────────────
    const account = {
      login:            tradingAccount.login,
      server:           tradingAccount.server,
      leverage:         tradingAccount.leverage,
      currency:         tradingAccount.currency,
      balance:          tradingAccount.balance,
      equity:           tradingAccount.equity,
      startingBalance:  tradingAccount.startingBalance,
      floatingPnl:      tradingAccount.floatingPnl,
      daily:            tradingAccount.daily,
      monthly:          tradingAccount.monthly,
      gain:             tradingAccount.gain,
      absGain:          tradingAccount.absGain,
      drawdown:         tradingAccount.drawdown,
      profit:           tradingAccount.profit,
      deposits:         tradingAccount.deposits,
      withdrawals:      tradingAccount.withdrawals,
      interest:         tradingAccount.interest,
      commission:       tradingAccount.commission,
      dailyHighBalance:  tradingAccount.dailyHighBalance,
      dailyDrawdownUsed: parseFloat(Math.abs(currentDailyLoss).toFixed(2)),
      maxDrawdownUsed:   parseFloat(Math.abs(currentTotalDrawdown).toFixed(2)),
      demo:             tradingAccount.demo,
      status:           tradingAccount.status,
      lastSync:         tradingAccount.lastSync,
      firstTradeDate:   tradingAccount.firstTradeDate,
      creationDate:     tradingAccount.creationDate,
    };

    return res.status(200).json({
      success: true,
      result: {
        account,
        stats,
        rules,
        openTrades,
        openOrders,
        closedTrades,   // last 50
        tradeHistory: closedTrades, // same — alias for frontend compatibility
      },
    });
  } catch (error) {
    console.error("[fetchTradingAcc] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /dashboard/gain/:id
   Returns dailyGain array for gain chart (last N days)
   Query param: ?days=90 (default 90)
───────────────────────────────────────────────────────────────── */
const fetchDailyGain = async (req, res) => {
  try {
    const { id }   = req.params;
    const days     = parseInt(req.query.days) || 90;

    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 });
    if (!tradingAccount) {
      return res.status(404).json({ success: false, message: "Trading account not found" });
    }

    const rows = await DailyGain.find({ tradingAccount: tradingAccount._id })
      .sort({ _id: -1 })   // insertion order = chronological since we upsert by date
      .limit(days)
      .lean();

    return res.status(200).json({
      success: true,
      result: rows.reverse(), // oldest first for charts
    });
  } catch (error) {
    console.error("[fetchDailyGain] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /dashboard/balance/:id
   Returns dataDaily (balance curve) for balance chart
   Query param: ?days=90 (default 90)
───────────────────────────────────────────────────────────────── */
const fetchDataDaily = async (req, res) => {
  try {
    const { id } = req.params;
    const days   = parseInt(req.query.days) || 90;

    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 });
    if (!tradingAccount) {
      return res.status(404).json({ success: false, message: "Trading account not found" });
    }

    const rows = await DataDaily.find({ tradingAccount: tradingAccount._id })
      .sort({ _id: -1 })
      .limit(days)
      .lean();

    return res.status(200).json({
      success: true,
      result: rows.reverse(), // oldest first for charts
    });
  } catch (error) {
    console.error("[fetchDataDaily] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ─────────────────────────────────────────────────────────────────
   GET /dashboard/history/:id
   Returns paginated full trade history
   Query params: ?page=1&limit=20
───────────────────────────────────────────────────────────────── */
const fetchTradeHistory = async (req, res) => {
  try {
    const { id }    = req.params;
    const page      = parseInt(req.query.page)  || 1;
    const limit     = parseInt(req.query.limit) || 20;
    const skip      = (page - 1) * limit;

    const tradingAccount = await TradingAccount.findOne({ account: id }, { _id: 1 });
    if (!tradingAccount) {
      return res.status(404).json({ success: false, message: "Trading account not found" });
    }

    const [trades, total] = await Promise.all([
      TradeHistory.find({ tradingAccount: tradingAccount._id })
        .sort({ closeTime: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      TradeHistory.countDocuments({ tradingAccount: tradingAccount._id }),
    ]);

    return res.status(200).json({
      success: true,
      result: {
        trades,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[fetchTradeHistory] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  fetchTradingAcc,
  fetchDailyGain,
  fetchDataDaily,
  fetchTradeHistory,
};