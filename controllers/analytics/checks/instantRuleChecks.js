// jobs/utils/instantRuleChecks.js
//
// Instant-account-only rule checks. Gated by isInstantAccount() — these
// run ONLY when the TradingAccount is an Instant account. Call
// runInstantChecks(account) from runAllChecks (see integration note).
//
// Requires (set at TradingAccount creation): challengeConfig.accountType = "instant"
// See setup note at the bottom of the file.

const OpenTrade    = require("../../../models/dashboard/openTrade");
const TradeHistory = require("../../../models/dashboard/tradeHistory");
const { saveWarning } = require("../utils/saveWarning");

/* ── shared date helpers (kept local to avoid cross-file coupling) ── */
const todayStr = () => new Date().toISOString().split("T")[0];

const parseMfxDate = (str) => {
  if (!str) return null;
  const iso = str.replace(/\./g, "-").replace(" ", "T") + ":00Z";
  const d   = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const getDataDateStr = (account) => {
  if (!account.lastUpdateDate) return todayStr();
  const d = new Date(account.lastUpdateDate);
  return isNaN(d.getTime()) ? todayStr() : d.toISOString().split("T")[0];
};

/* ── Instant gate ─────────────────────────────────────────────────── */
const isInstantAccount = (account) => {
  const t = account?.challengeConfig?.accountType ?? account?.accountType;
  return typeof t === "string" && t.toLowerCase() === "instant";
};

/* ── Per-instrument lot caps by account size ──────────────────────── */
const INSTANT_LOT_CAPS = {
  5000:  { forex: 0.25, gold: 0.05, indices: 0.50 },
  10000: { forex: 0.50, gold: 0.10, indices: 1.00 },
  25000: { forex: 1.00, gold: 0.20, indices: 2.00 },
  50000: { forex: 2.50, gold: 0.50, indices: 5.00 },
};

/* ── Symbol → instrument class ────────────────────────────────────── */
const CURRENCIES = new Set([
  "USD","EUR","GBP","JPY","CHF","AUD","NZD","CAD","SGD","HKD",
  "NOK","SEK","DKK","ZAR","MXN","TRY","PLN","CNH","CZK","HUF",
]);
const INDEX_TOKENS = [
  "US30","US500","US100","USTEC","NAS100","NAS","SPX500","SPX","DJI","DJ30",
  "GER40","GER30","DE40","DE30","DAX","UK100","FTSE","JP225","JPN225","NI225",
  "NIKKEI","AUS200","AU200","ASX200","HK50","HSI","FRA40","FR40","CAC",
  "EU50","EUSTX50","STOXX","ES35","SPA35","IT40","NETH25","SWI20","US2000",
];

const classifySymbol = (symbol) => {
  if (!symbol) return null;
  const s = symbol.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.includes("XAU") || s.includes("GOLD")) return "gold";
  if (INDEX_TOKENS.some((tok) => s.startsWith(tok))) return "indices";
  const base = s.slice(0, 3);
  const quote = s.slice(3, 6);
  if (CURRENCIES.has(base) && CURRENCIES.has(quote)) return "forex";
  return null; // silver, oil, crypto, etc. — not covered by the table
};

// ─────────────────────────────────────────────────────────────────────────────
// I1. RISK GUARD  (direct breach)
//     Largest realized losing trade must not exceed largest realized winning trade.
// ─────────────────────────────────────────────────────────────────────────────
const checkRiskGuard = async (account) => {
  try {
    const cfg = account.challengeConfig ?? {};
    if (cfg.riskGuard === false) return;

    const closed = await TradeHistory.find(
      { tradingAccount: account._id },
      { profit: 1, symbol: 1, openTime: 1 }
    ).lean();

    const wins   = closed.filter((t) => (t.profit ?? 0) > 0);
    const losses = closed.filter((t) => (t.profit ?? 0) < 0);

    // Comparative rule — need at least one win to define the ceiling
    if (!wins.length || !losses.length) return;

    const maxWin  = Math.max(...wins.map((t) => t.profit));
    const worst   = losses.reduce((a, b) => (Math.abs(b.profit) > Math.abs(a.profit) ? b : a));
    const maxLoss = Math.abs(worst.profit);

    if (maxLoss <= maxWin) return;

    await saveWarning({
      tradingAccount: account._id,
      user:           account.userId,
      type:           "RISK_GUARD",
      severity:       "breach",
      title:          "Risk Guard Rule Breached",
      message:        `Largest losing trade ($${maxLoss.toFixed(2)} on ${worst.symbol}) exceeds largest winning trade ($${maxWin.toFixed(2)}). Risk Guard rule breached.`,
      snapshot:       { maxLoss, maxWin, worstSymbol: worst.symbol, worstOpenTime: worst.openTime },
      dedupKey:       `RISK_GUARD:breach`,
    });
  } catch (err) {
    console.error(`[checkRiskGuard] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// I2. STOP LOSS REQUIRED  (warning → escalates at 3)
//     Every open position (and today's closed trades) must have an SL.
// ─────────────────────────────────────────────────────────────────────────────
const checkStopLoss = async (account) => {
  try {
    const cfg = account.challengeConfig ?? {};
    if (cfg.stopLossRequired === false) return;

    const dataDateStr = getDataDateStr(account);

    const [openTrades, closedToday] = await Promise.all([
      OpenTrade.find(
        { tradingAccount: account._id, isPending: false },
        { symbol: 1, sl: 1, openTime: 1 }
      ).lean(),
      TradeHistory.find(
        { tradingAccount: account._id, closeTime: { $gte: dataDateStr + " 00:00", $lte: dataDateStr + " 23:59" } },
        { symbol: 1, sl: 1, openTime: 1, closeTime: 1 }
      ).lean(),
    ]);

    for (const t of openTrades) {
      if (t.sl) continue; // has SL
      await saveWarning({
        tradingAccount: account._id,
        user:           account.userId,
        type:           "NO_STOP_LOSS",
        severity:       "warning",
        title:          `No Stop Loss — ${t.symbol}`,
        message:        `Open trade on ${t.symbol} has no Stop Loss set. All trades must have an SL.`,
        snapshot:       { symbol: t.symbol, openTime: t.openTime, state: "open" },
        dedupKey:       `NOSL:${t.symbol}:${t.openTime}`,
      });
    }

    for (const t of closedToday) {
      if (t.sl) continue;
      await saveWarning({
        tradingAccount: account._id,
        user:           account.userId,
        type:           "NO_STOP_LOSS",
        severity:       "warning",
        title:          `No Stop Loss — ${t.symbol}`,
        message:        `Trade on ${t.symbol} was traded without a Stop Loss. All trades must have an SL.`,
        snapshot:       { symbol: t.symbol, openTime: t.openTime, closeTime: t.closeTime, state: "closed" },
        dedupKey:       `NOSL:${t.symbol}:${t.openTime}:${t.closeTime}`,
      });
    }
  } catch (err) {
    console.error(`[checkStopLoss] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// I3. MINIMUM HOLD TIME  (warning → escalates at 3)
//     Trades must be held at least `minHoldSeconds` (default 60s).
// ─────────────────────────────────────────────────────────────────────────────
const checkMinHoldTime = async (account) => {
  try {
    const cfg = account.challengeConfig ?? {};
    const minHoldSeconds = cfg.minHoldSeconds ?? 60;
    if (minHoldSeconds <= 0) return;

    const dataDateStr = getDataDateStr(account);
    const minMs = minHoldSeconds * 1000;

    const closedToday = await TradeHistory.find(
      { tradingAccount: account._id, closeTime: { $gte: dataDateStr + " 00:00", $lte: dataDateStr + " 23:59" } },
      { symbol: 1, openTime: 1, closeTime: 1, profit: 1 }
    ).lean();

    for (const t of closedToday) {
      const openMs  = parseMfxDate(t.openTime)?.getTime();
      const closeMs = parseMfxDate(t.closeTime)?.getTime();
      if (!openMs || !closeMs) continue;

      const heldMs = closeMs - openMs;
      if (heldMs >= minMs) continue;

      await saveWarning({
        tradingAccount: account._id,
        user:           account.userId,
        type:           "MIN_HOLD_TIME",
        severity:       "warning",
        title:          `Trade Held Under ${minHoldSeconds}s — ${t.symbol}`,
        message:        `Trade on ${t.symbol} was held ${Math.round(heldMs / 1000)}s — minimum hold time is ${minHoldSeconds}s.`,
        snapshot:       { symbol: t.symbol, openTime: t.openTime, closeTime: t.closeTime, heldSeconds: Math.round(heldMs / 1000), minHoldSeconds },
        dedupKey:       `MINHOLD:${t.symbol}:${t.openTime}:${t.closeTime}`,
      });
    }
  } catch (err) {
    console.error(`[checkMinHoldTime] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// I4. INSTANT LOT SIZE  (warning → escalates at 3)
//     Per-instrument-class cap by account size. Summed across open trades
//     (combined exposure per class), matching the "combined lots" semantics.
// ─────────────────────────────────────────────────────────────────────────────
const checkInstantLotSize = async (account) => {
  try {
    const startBal = account.startingBalance ?? 0;
    const caps = INSTANT_LOT_CAPS[Math.round(startBal)];
    if (!caps) return; // no defined tier for this account size — skip

    const openTrades = await OpenTrade.find(
      { tradingAccount: account._id, isPending: false },
      { symbol: 1, lots: 1, openTime: 1 }
    ).lean();
    if (!openTrades.length) return;

    // Sum lots per instrument class
    const totals = { forex: 0, gold: 0, indices: 0 };
    for (const t of openTrades) {
      const cls = classifySymbol(t.symbol);
      if (cls && totals[cls] != null) totals[cls] += t.lots ?? 0;
    }

    const dataDateStr = getDataDateStr(account);

    for (const cls of ["forex", "gold", "indices"]) {
      const used = parseFloat(totals[cls].toFixed(2));
      const cap  = caps[cls];
      if (used <= cap) continue;

      await saveWarning({
        tradingAccount: account._id,
        user:           account.userId,
        type:           "LOT_SIZE",
        severity:       "warning",
        title:          `Lot Size Exceeded — ${cls.toUpperCase()}`,
        message:        `Combined ${cls} open lots = ${used} — max allowed for a $${Math.round(startBal).toLocaleString()} account is ${cap}.`,
        snapshot:       { instrumentClass: cls, usedLots: used, cap, accountSize: Math.round(startBal), dataDate: dataDateStr },
        // dedupKey scoped to the data date so a fresh breach can be raised each day
        dedupKey:       `LOT:INSTANT:${cls}:${dataDateStr}`,
      });
    }
  } catch (err) {
    console.error(`[checkInstantLotSize] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// runInstantChecks — gated entry point
// ─────────────────────────────────────────────────────────────────────────────
const runInstantChecks = async (account) => {
  if (!isInstantAccount(account)) return;

  await checkRiskGuard(account);      // direct breach
  await checkStopLoss(account);       // warning (escalates)
  await checkMinHoldTime(account);    // warning (escalates)
  await checkInstantLotSize(account); // warning (escalates)
};

module.exports = {
  runInstantChecks,
  isInstantAccount,
  checkRiskGuard,
  checkStopLoss,
  checkMinHoldTime,
  checkInstantLotSize,
  classifySymbol,
  INSTANT_LOT_CAPS,
};