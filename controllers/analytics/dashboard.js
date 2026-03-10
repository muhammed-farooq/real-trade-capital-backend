// const dotenv = require("dotenv");
// dotenv.config();

// const axios = require("axios");
// const TradingAccount = require("../../models/dashboard/tradingAcc");
// const MyFxSession = require("../../models/dashboard/myfxSession");

// const myFxbookEmail = process.env.MYFXBOOK_EMAIL;

// const fetchMyFxBookAcc = async (login) => {
//   try {
//     const sessionDoc = await MyFxSession.findOne(
//       { email: myFxbookEmail },
//       { session: 1, _id: 0 }
//     );

//     if (!sessionDoc?.session) {
//       console.log("[fetchMyFxBookAcc] session not found");
//       return null;
//     }

//     const { data } = await axios.get(
//       `https://www.myfxbook.com/api/get-my-accounts.json?session=${sessionDoc.session}`
//     );

//     if (data.error) {
//       console.log("[fetchMyFxBookAcc] API error:", data.message || data.error);
//       return null;
//     }

//     return data.accounts.find((a) => String(a.accountId) === String(login)) ?? null;
//   } catch (err) {
//     console.log("[fetchMyFxBookAcc] error:", err.message);
//     return null;
//   }
// };

// const syncMyfxbookData = async (tradingAccount, mfxAcc) => {
//   try {
//     tradingAccount.myfxbookId     = mfxAcc.id             ?? tradingAccount.myfxbookId;
//     tradingAccount.name           = mfxAcc.name           ?? tradingAccount.name;
//     tradingAccount.balance        = mfxAcc.balance        ?? 0;
//     tradingAccount.equity         = mfxAcc.equity         ?? 0;
//     tradingAccount.equityPercent  = mfxAcc.equityPercent  ?? 0;
//     tradingAccount.profit         = mfxAcc.profit         ?? 0;
//     tradingAccount.gain           = mfxAcc.gain           ?? 0;
//     tradingAccount.absGain        = mfxAcc.absGain        ?? 0;
//     tradingAccount.daily          = mfxAcc.daily          ?? 0;
//     tradingAccount.monthly        = mfxAcc.monthly        ?? 0;
//     tradingAccount.drawdown       = mfxAcc.drawdown       ?? 0;
//     tradingAccount.deposits       = mfxAcc.deposits       ?? 0;
//     tradingAccount.withdrawals    = mfxAcc.withdrawals    ?? 0;
//     tradingAccount.interest       = mfxAcc.interest       ?? 0;
//     tradingAccount.commission     = mfxAcc.commission     ?? 0;
//     tradingAccount.currency       = mfxAcc.currency       ?? "USD";
//     tradingAccount.profitFactor   = mfxAcc.profitFactor   ?? 0;
//     tradingAccount.pips           = mfxAcc.pips           ?? 0;
//     tradingAccount.demo           = mfxAcc.demo           ?? false;
//     tradingAccount.server         = mfxAcc.server?.name   ?? tradingAccount.server;
//     tradingAccount.lastUpdateDate = mfxAcc.lastUpdateDate ?? tradingAccount.lastUpdateDate;
//     tradingAccount.creationDate   = mfxAcc.creationDate   ?? tradingAccount.creationDate;
//     tradingAccount.firstTradeDate = mfxAcc.firstTradeDate ?? tradingAccount.firstTradeDate;

//     // floatingPnl = equity - balance (open position PnL)
//     tradingAccount.floatingPnl = (mfxAcc.equity ?? 0) - (mfxAcc.balance ?? 0);

//     // dailyHighBalance — only update if today's balance is higher
//     const today = new Date().toDateString();
//     const lastDate = tradingAccount.dailyHighBalanceDate
//       ? new Date(tradingAccount.dailyHighBalanceDate).toDateString()
//       : null;

//     if (lastDate !== today) {
//       // New day — reset high to current balance
//       tradingAccount.dailyHighBalance     = mfxAcc.balance ?? 0;
//       tradingAccount.dailyHighBalanceDate = new Date();
//     } else if ((mfxAcc.balance ?? 0) > (tradingAccount.dailyHighBalance ?? 0)) {
//       tradingAccount.dailyHighBalance = mfxAcc.balance;
//     }

//     tradingAccount.status    = "active";
//     tradingAccount.syncError = undefined;
//     tradingAccount.lastSync  = new Date();

//     await tradingAccount.save();
//   } catch (err) {
//     console.error("[syncMyfxbookData] save error:", err.message);
//     tradingAccount.status    = "failed";
//     tradingAccount.syncError = err.message;
//     await tradingAccount.save().catch(() => {});
//   }
// };

// const fetchTradingAcc = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const tradingAccount = await TradingAccount.findOne({ account: id });
//     if (!tradingAccount) {
//       return res.status(404).json({ success: false, message: "Trading account not found" });
//     }

//     if (!tradingAccount.login) {
//       return res.status(200).json({
//         success: true,
//         data: tradingAccount,
//         synced: false,
//       });
//     }

//     const mfxAcc = await fetchMyFxBookAcc(tradingAccount.login);

//     if (mfxAcc) {
//       await syncMyfxbookData(tradingAccount, mfxAcc);
//     } else {
//       tradingAccount.lastSync = new Date();
//       await tradingAccount.save().catch(() => {});
//     }

//     return res.status(200).json({
//       success: true,
//       data: tradingAccount,       
//       synced: !!mfxAcc,
//     });
//   } catch (error) {
//     console.error("[fetchTradingAcc] error:", error.message);
//     return res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { fetchTradingAcc };

const TradingAccount = require("../../models/dashboard/tradingAcc");
const OpenTrade      = require("../../models/dashboard/OpenTrade");
const TradeHistory   = require("../../models/dashboard/TradeHistory");
const DailyGain      = require("../../models/dashboard/DailyGain");
const DataDaily      = require("../../models/dashboard/DataDaily");

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
      totalTrades:  allClosed.length,
      winTrades:    wins.length,
      lossTrades:   losses.length,
      winRate:      parseFloat(winRate.toFixed(2)),
      avgWin:       parseFloat(avgWin.toFixed(2)),
      avgLoss:      parseFloat(avgLoss.toFixed(2)),
      bestTrade:    parseFloat(bestTrade.toFixed(2)),
      worstTrade:   parseFloat(worstTrade.toFixed(2)),
      profitFactor: tradingAccount.profitFactor ?? 0,
      tradingDays,
    };

    // ── Compute challenge rule status ─────────────────────────────────────────
    const cfg = tradingAccount.challengeConfig ?? {};
    const startBal = tradingAccount.startingBalance ?? 0;
    const balance  = tradingAccount.balance ?? 0;
    const dailyHigh = tradingAccount.dailyHighBalance ?? balance;

    const currentDailyLoss  = dailyHigh > 0 ? ((balance - dailyHigh) / startBal) * 100 : 0;
    const currentTotalLoss  = startBal  > 0 ? ((balance - startBal)  / startBal) * 100 : 0;
    const currentProfit     = startBal  > 0 ? ((balance - startBal)  / startBal) * 100 : 0;
    const currentMaxLot     = openTrades.length ? Math.max(...openTrades.map((t) => t.lots ?? 0)) : 0;

    const rules = {
      currentDailyLoss:    parseFloat(currentDailyLoss.toFixed(2)),
      maxDailyLoss:        cfg.maxDailyLoss   ?? 5,
      dailyLossPassed:     Math.abs(currentDailyLoss) <= (cfg.maxDailyLoss ?? 5),

      currentTotalLoss:    parseFloat(currentTotalLoss.toFixed(2)),
      maxTotalLoss:        cfg.maxTotalLoss   ?? 10,
      totalLossPassed:     Math.abs(currentTotalLoss) <= (cfg.maxTotalLoss ?? 10),

      currentProfit:       parseFloat(currentProfit.toFixed(2)),
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
      dailyHighBalance: tradingAccount.dailyHighBalance,
      dailyDrawdownUsed: parseFloat(Math.abs(currentDailyLoss).toFixed(2)),
      maxDrawdownUsed:   parseFloat(Math.abs(currentTotalLoss).toFixed(2)),
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
      .sort({ date: -1 })
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
      .sort({ date: -1 })
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