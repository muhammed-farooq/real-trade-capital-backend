// controllers/accountDashboardController.js
// GET  /account-dashboard/:id          → serve dashboard data from DB
// POST /account-dashboard/:id/sync     → trigger a live sync from MyFxBook then serve

const TradingAccount = require("../models/TradingAccount");
const OpenTrade      = require("../models/OpenTrade");
const TradeHistory   = require("../models/TradeHistory");
const DailyGain      = require("../models/DailyGain");
const DataDaily      = require("../models/DataDaily");

const { syncAccount }    = require("../../services/syncAccount");
const { computeStats }   = require("../../services/computeStats");
const { computeRules }   = require("../../services/computeRules");

// How many minutes before data is considered stale and we auto-sync
const STALE_MINUTES = 15;

/**
 * Shape an open trade from DB into the AccountPerformance.jsx format.
 */
function shapeOpenTrade(t) {
  return {
    ticket:    t._id?.toString(),
    action:    t.action,
    symbol:    t.symbol,
    lots:      t.lots,
    openPrice: t.openPrice,
    tp:        t.tp,
    sl:        t.sl,
    profit:    t.profit,
    pips:      t.pips,
    swap:      t.swap,
    commission:t.commission ?? 0,
    comment:   t.comment,
    openTime:  t.openTime,
  };
}

/**
 * Shape a history trade from DB into the AccountPerformance.jsx format.
 */
function shapeHistoryTrade(t) {
  return {
    ticket:     t._id?.toString(),
    action:     t.action,
    symbol:     t.symbol,
    lots:       t.lots,
    openPrice:  t.openPrice,
    closePrice: t.closePrice,
    tp:         t.tp,
    sl:         t.sl,
    profit:     t.profit,
    pips:       t.pips,
    swap:       t.swap,
    commission: t.commission,
    comment:    t.comment,
    openTime:   t.openTime,
    closeTime:  t.closeTime,
  };
}

/**
 * Read all data from DB and build the full dashboard response.
 * Does NOT hit MyFxBook — reads only from your MongoDB.
 */
async function buildDashboardResponse(accountId) {
  const [account, openTradesRaw, historyRaw, dailyGainDoc, dataDailyDoc] =
    await Promise.all([
      TradingAccount.findById(accountId).lean(),
      OpenTrade.find({ accountId }).sort({ openTime: -1 }).lean(),
      TradeHistory.find({ accountId }).sort({ closeTime: -1 }).lean(),
      DailyGain.findOne({ accountId }).lean(),
      DataDaily.findOne({ accountId }).lean(),
    ]);

  if (!account) throw new Error("Account not found");

  // ── Shape trades ──────────────────────────────────────────────────────────
  const openTrades   = openTradesRaw.map(shapeOpenTrade);
  const tradeHistory = historyRaw.map(shapeHistoryTrade);

  // closedTrades = most recent 20 for the "Closed" tab
  // tradeHistory = full list for the "History" tab
  const closedTrades = tradeHistory.slice(0, 20);

  // ── Compute derived data ──────────────────────────────────────────────────
  const stats = computeStats(historyRaw, account.challengeConfig?.minTradingDays ?? 10);
  const rules = computeRules(
    {
      balance:         account.balance,
      equity:          account.equity,
      startingBalance: account.startingBalance,
      dailyHighBalance:account.dailyHighBalance,
      profit:          account.profit,
    },
    account.challengeConfig ?? {},
    historyRaw,
    openTradesRaw
  );

  // ── Shape dailyGain ───────────────────────────────────────────────────────
  // MyFxBook format: { date: "02/01/2010", value, profit }
  // Frontend wants:  { date: "MM/DD",      value, profit }
  const dailyGain = (dailyGainDoc?.data ?? []).map(d => ({
    date:   d.date,       // keep as-is, shortD() in frontend handles both
    value:  d.value,
    profit: d.profit,
  }));

  // ── Shape dataDaily ───────────────────────────────────────────────────────
  const dataDaily = (dataDailyDoc?.data ?? []).map(d => ({
    date:    d.date,
    balance: d.balance,
    profit:  d.profit,
  }));

  // ── Shape the account object for the frontend ─────────────────────────────
  const accountOut = {
    login:            account.login,
    server:           account.server,
    leverage:         account.leverage,
    currency:         account.currency,
    balance:          account.balance,
    equity:           account.equity,
    startingBalance:  account.startingBalance,
    freeMargin:       account.equity - (account.balance - account.equity),  // approximation
    marginLevel:      account.equity > 0 ? (account.equity / account.balance) * 100 : 0,
    daily:            account.daily,
    monthly:          account.monthly,
    dailyHighBalance: account.dailyHighBalance,
    dailyDrawdownUsed:Math.abs(rules.currentDailyLoss),
    maxDrawdownUsed:  Math.abs(rules.currentTotalLoss),
    floatingPnl:      openTrades.reduce((s, t) => s + (t.profit ?? 0), 0),
    lastSync:         account.lastSync,
    // Extra fields some UIs use
    drawdown:         account.drawdown,
    profit:           account.profit,
    gain:             account.gain,
  };

  return {
    account:     accountOut,
    stats,
    rules,
    openTrades,
    closedTrades,
    tradeHistory,
    dailyGain,
    dataDaily,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /account-dashboard/:id
// Returns cached data; auto-syncs if stale
// ─────────────────────────────────────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const account = await TradingAccount.findById(id).lean();
    if (!account) return res.status(404).json({ error: true, message: "Account not found" });

    // Ensure this account belongs to the requesting user
    if (account.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    // ── Auto-sync if data is stale ────────────────────────────────────────
    const lastSync   = account.lastSync ? new Date(account.lastSync) : null;
    const ageMinutes = lastSync ? (Date.now() - lastSync.getTime()) / 60000 : Infinity;

    if (ageMinutes > STALE_MINUTES) {
      try {
        // Decrypt session before passing (implement decryptSession() as needed)
        const accountWithSession = await TradingAccount.findById(id); // full doc with session
        await syncAccount(accountWithSession);
      } catch (syncErr) {
        // Non-fatal: serve stale data if sync fails
        console.error(`[dashboard] Auto-sync failed for ${id}:`, syncErr.message);
      }
    }

    // ── Build and return response ─────────────────────────────────────────
    const result = await buildDashboardResponse(id);
    return res.json({ result });

  } catch (err) {
    console.error("[getDashboard]", err);
    return res.status(500).json({ error: true, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /account-dashboard/:id/sync
// Force a fresh sync from MyFxBook right now
// ─────────────────────────────────────────────────────────────────────────────
const syncDashboard = async (req, res) => {
  try {
    const { id } = req.params;

    const accountDoc = await TradingAccount.findById(id);
    if (!accountDoc) return res.status(404).json({ error: true, message: "Account not found" });

    if (accountDoc.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: true, message: "Forbidden" });
    }

    // Sync — decrypt the stored session first
    // accountDoc.myfxbookSession should be decrypted here if you encrypt it
    await syncAccount(accountDoc);

    // Return fresh data
    const result = await buildDashboardResponse(id);
    return res.json({ result });

  } catch (err) {
    console.error("[syncDashboard]", err);
    return res.status(500).json({ error: true, message: err.message });
  }
};

module.exports = { getDashboard, syncDashboard };