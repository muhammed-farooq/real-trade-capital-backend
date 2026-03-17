// jobs/utils/ruleChecks.js
const OpenTrade      = require("../../../models/dashboard/openTrade");
const TradeHistory   = require("../../../models/dashboard/tradeHistory");
const TradingAccount = require("../../../models/dashboard/tradingAccount");
const { saveWarning }                    = require("../utils/saveWarning");
const { fetchHighImpactNews, warmCache } = require("../utils/fetchHighImpactNews");
const { passAccount } = require("../utils/accountlifecycle");

const todayStr = () => new Date().toISOString().split("T")[0];

const parseMfxDate = (str) => {
  if (!str) return null;
  const iso = str.replace(/\./g, "-").replace(" ", "T") + ":00Z";
  const d   = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const isAccountFailed = async (accountId) => {
  const acc = await TradingAccount.findById(accountId, { status: 1 }).lean();
  if (!acc) return true;
  return acc.status === "failed" || acc.status === "completed";
};

const getDataDateStr = (account) => {
  if (!account.lastUpdateDate) return todayStr();
  const d = new Date(account.lastUpdateDate);
  return isNaN(d.getTime()) ? todayStr() : d.toISOString().split("T")[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. WEEKEND HOLD
// ─────────────────────────────────────────────────────────────────────────────
const checkWeekendHold = async (account) => {
  try {
    const now = new Date();
    if (now.getUTCDay() !== 6) return;

    const lastUpdate = account.lastUpdateDate ? new Date(account.lastUpdateDate) : null;
    if (!lastUpdate || lastUpdate.getUTCDay() !== 6) return;

    const openTrades = await OpenTrade.find(
      { tradingAccount: account._id, isPending: false },
      { symbol: 1, lots: 1, profit: 1 }
    ).lean();
    if (!openTrades.length) return;

    const dataDateStr = getDataDateStr(account);
    const symbols     = openTrades.map((t) => t.symbol).join(", ");

    await saveWarning({
      tradingAccount: account._id,
      user:           account.userId,
      type:           "WEEKEND_HOLD",
      severity:       "warning",
      title:          "Open Trades Held Over Weekend",
      message:        `Account has ${openTrades.length} open trade(s) into the weekend: ${symbols}. Positions must be closed before the weekend.`,
      snapshot:       { openTradeCount: openTrades.length, symbols, dataDate: dataDateStr, checkedAt: now.toISOString() },
      dedupKey:       `WEEKEND_HOLD:${dataDateStr}`,
    });

    // Mark weekendHolding as violated on the TradingAccount rules subdoc
    await TradingAccount.updateOne(
      { _id: account._id },
      { $set: { "rules.weekendHolding": "violated" } }
    );
  } catch (err) {
    console.error(`[checkWeekendHold] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2a. DAILY DRAWDOWN  (direct breach)
//
// Measured as: how much has the balance dropped TODAY from today's peak.
// Formula: (dailyHighBalance - balance) / startingBalance * 100
//
// Example:
//   startingBalance = $100,000
//   Account is currently profitable: balance = $120,000
//   Today's high = $121,000
//   Current balance = $119,000
//   Daily loss = ($121,000 - $119,000) / $100,000 = 2% → no breach at 5% limit
//
// The denominator is always startingBalance (the fixed challenge base),
// not dailyHighBalance — this matches standard prop firm convention.
// ─────────────────────────────────────────────────────────────────────────────
const checkDailyDrawdown = async (account) => {
  try {
    const cfg      = account.challengeConfig ?? {};
    const maxDaily = cfg.maxDailyLoss ?? 5;

    const startBal  = account.startingBalance  ?? 0;
    const balance   = account.balance          ?? 0;
    const dailyHigh = account.dailyHighBalance ?? balance;

    if (!startBal || !balance) return;

    // Drop from today's peak, expressed as % of starting balance
    const dailyDropPct = parseFloat(
      (((dailyHigh - balance) / startBal) * 100).toFixed(2)
    );

    // No daily loss today — nothing to check
    if (dailyDropPct <= 0) return;
    if (dailyDropPct < maxDaily) return;

    const dataDateStr = getDataDateStr(account);

    await saveWarning({
      tradingAccount: account._id,
      user:           account.userId,
      type:           "DAILY_DRAWDOWN",
      severity:       "breach",
      title:          "Daily Drawdown Limit Breached",
      message:        `Daily drawdown hit ${dailyDropPct.toFixed(2)}% — limit is ${maxDaily}%. Challenge rule breached.`,
      snapshot:       { balance, dailyHigh, startBal, dailyDropPct, maxDailyLoss: maxDaily, dataDate: dataDateStr },
      dedupKey:       `DAILY_DD:${dataDateStr}:breach`,
    });
  } catch (err) {
    console.error(`[checkDailyDrawdown] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2b. MAX (TOTAL) DRAWDOWN  (direct breach)
//
// Measured as: total drop from startingBalance, regardless of intraday moves.
// Formula: (startingBalance - balance) / startingBalance * 100
//
// Example:
//   startingBalance = $100,000
//   balance = $120,000 (account in profit) → totalDropPct = -20% → NO breach
//   balance = $95,000                      → totalDropPct =   5% → breach at 5%
//   balance = $90,000                      → totalDropPct =  10% → breach at 10%
//
// If daily drawdown brings balance down 4% today AND 4% yesterday but the
// account started from profit ($120k), it does NOT breach the total drawdown
// limit unless balance actually falls below startingBalance * (1 - maxTotal%).
// ─────────────────────────────────────────────────────────────────────────────
const checkMaxDrawdown = async (account) => {
  try {
    const cfg      = account.challengeConfig ?? {};
    const maxTotal = cfg.maxTotalLoss ?? 10;

    const startBal = account.startingBalance ?? 0;
    const balance  = account.balance         ?? 0;

    if (!startBal || !balance) return;

    // How much has balance dropped below startingBalance as a %
    // If balance >= startingBalance this is <= 0 → no breach possible
    const totalDropPct = parseFloat(
      (((startBal - balance) / startBal) * 100).toFixed(2)
    );

    if (totalDropPct <= 0) return;      // still in profit vs starting balance
    if (totalDropPct < maxTotal) return; // below the breach threshold

    const dataDateStr = getDataDateStr(account);

    await saveWarning({
      tradingAccount: account._id,
      user:           account.userId,
      type:           "MAX_DRAWDOWN",
      severity:       "breach",
      title:          "Max Drawdown Limit Breached",
      message:        `Total drawdown is ${totalDropPct.toFixed(2)}% from starting balance — limit is ${maxTotal}%. Challenge rule breached.`,
      snapshot:       { balance, startBal, totalDropPct, maxTotalLoss: maxTotal, dataDate: dataDateStr },
      dedupKey:       `MAX_DD:${dataDateStr}:breach`,
    });
  } catch (err) {
    console.error(`[checkMaxDrawdown] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. NEWS TRADING  (3× escalation)
// ─────────────────────────────────────────────────────────────────────────────
const NEWS_WINDOW_MINUTES = 2;

const checkNewsTrading = async (account) => {
  try {
    const cfg = account.challengeConfig ?? {};
    if (cfg.newsTrading === false) return;

    const newsEvents = fetchHighImpactNews(); // sync cache read after warmCache()
    if (!newsEvents.length) return;

    const dataDateStr = getDataDateStr(account);
    const windowMs    = NEWS_WINDOW_MINUTES * 60 * 1000;

    const [closedToday, openTrades] = await Promise.all([
      TradeHistory.find(
        { tradingAccount: account._id, closeTime: { $gte: dataDateStr + " 00:00", $lte: dataDateStr + " 23:59" } },
        { symbol: 1, openTime: 1, closeTime: 1, profit: 1, lots: 1 }
      ).lean(),
      OpenTrade.find(
        { tradingAccount: account._id, isPending: false },
        { symbol: 1, openTime: 1 }
      ).lean(),
    ]);

    let newsViolationDetected = false;

    for (const event of newsEvents) {
      const eventMs = event.timestamp;

      for (const trade of closedToday) {
        const openMs  = parseMfxDate(trade.openTime)?.getTime();
        const closeMs = parseMfxDate(trade.closeTime)?.getTime();
        const openNearNews  = openMs  && Math.abs(openMs  - eventMs) <= windowMs;
        const closeNearNews = closeMs && Math.abs(closeMs - eventMs) <= windowMs;
        if (!openNearNews && !closeNearNews) continue;

        await saveWarning({
          tradingAccount: account._id,
          user:           account.userId,
          type:           "NEWS_TRADING",
          severity:       "warning",
          title:          `News Trading — ${event.title}`,
          message:        `Trade on ${trade.symbol} was ${openNearNews ? "opened" : "closed"} within ${NEWS_WINDOW_MINUTES} min of "${event.title}" (${event.currency}, ${event.time} UTC).`,
          snapshot:       { tradeSymbol: trade.symbol, openTime: trade.openTime, closeTime: trade.closeTime, newsTitle: event.title, newsCurrency: event.currency, newsTime: `${event.date} ${event.time} UTC` },
          dedupKey:       `NEWS:${event.date}:${event.time}:${trade.symbol}:${trade.openTime}`,
        });
        newsViolationDetected = true;
      }

      for (const trade of openTrades) {
        const openMs = parseMfxDate(trade.openTime)?.getTime();
        if (!openMs || Math.abs(openMs - eventMs) > windowMs) continue;

        await saveWarning({
          tradingAccount: account._id,
          user:           account.userId,
          type:           "NEWS_TRADING",
          severity:       "warning",
          title:          `News Trading (Open) — ${event.title}`,
          message:        `Open trade on ${trade.symbol} entered within ${NEWS_WINDOW_MINUTES} min of "${event.title}" (${event.currency}, ${event.time} UTC).`,
          snapshot:       { tradeSymbol: trade.symbol, openTime: trade.openTime, newsTitle: event.title, newsCurrency: event.currency, newsTime: `${event.date} ${event.time} UTC` },
          dedupKey:       `NEWS:OPEN:${event.date}:${event.time}:${trade.symbol}:${trade.openTime}`,
        });
        newsViolationDetected = true;
      }
    }

    if (newsViolationDetected) {
      await TradingAccount.updateOne(
        { _id: account._id },
        { $set: { "rules.newsTrading": "violated" } }
      );
    }
  } catch (err) {
    console.error(`[checkNewsTrading] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. LOT SIZE  (3× escalation)
//
// maxLotSize = 0 means UNLIMITED — skip the check entirely.
// Mainly applies to funded stage accounts which may have a real cap (e.g. 5).
// ─────────────────────────────────────────────────────────────────────────────
const checkLotSize = async (account) => {
  try {
    const cfg    = account.challengeConfig ?? {};
    const maxLot = cfg.maxLotSize ?? 0;

    // 0 = no limit — nothing to enforce
    if (!maxLot || maxLot <= 0) return;

    const openTrades = await OpenTrade.find(
      { tradingAccount: account._id, isPending: false },
      { symbol: 1, lots: 1, openTime: 1 }
    ).lean();

    for (const trade of openTrades) {
      const lots = trade.lots ?? 0;
      if (lots <= maxLot) continue;

      await saveWarning({
        tradingAccount: account._id,
        user:           account.userId,
        type:           "LOT_SIZE",
        severity:       "warning",
        title:          `Lot Size Exceeded — ${trade.symbol}`,
        message:        `Open trade on ${trade.symbol} uses ${lots} lots — max allowed is ${maxLot}.`,
        snapshot:       { symbol: trade.symbol, lots, maxLot, openTime: trade.openTime },
        dedupKey:       `LOT:${trade.symbol}:${trade.openTime}`,
      });
    }
  } catch (err) {
    console.error(`[checkLotSize] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. BALANCE BREACH  (direct breach)
//
// Hard floor = startingBalance * (1 - maxTotalLoss / 100)
// If balance falls to or below the floor the account has definitively breached.
// This is consistent with checkMaxDrawdown — both measure from startingBalance.
// ─────────────────────────────────────────────────────────────────────────────
const checkBalanceBreach = async (account) => {
  try {
    const cfg      = account.challengeConfig ?? {};
    const maxTotal = cfg.maxTotalLoss ?? 10;

    const startBal = account.startingBalance ?? 0;
    const balance  = account.balance         ?? 0;

    if (!startBal || !balance) return;

    const floor = parseFloat((startBal * (1 - maxTotal / 100)).toFixed(2));
    if (balance > floor) return;

    await saveWarning({
      tradingAccount: account._id,
      user:           account.userId,
      type:           "BALANCE_BREACH",
      severity:       "breach",
      title:          "Account Balance Breach — Challenge Failed",
      message:        `Balance $${balance.toFixed(2)} has fallen to or below the max-loss floor of $${floor.toFixed(2)} (${maxTotal}% of starting $${startBal.toFixed(2)}).`,
      snapshot:       { balance, floor, startBal, maxTotalLoss: maxTotal },
      dedupKey:       `BALANCE_BREACH:${floor}`,
    });
  } catch (err) {
    console.error(`[checkBalanceBreach] account=${account._id}:`, err.message);
  }
};

const checkChallengePass = async (account) => {
  try {
    const cfg = account.challengeConfig ?? {};

    const profitTarget = cfg.profitTarget  ?? 10;
    const minDays      = cfg.minTradingDays ?? 0;

    const startBal = account.startingBalance ?? 0;
    const balance  = account.balance         ?? 0;

    if (!startBal || !balance) return;

    // ── (a) Already passed/completed? ────────────────────────────────────────
    if (account.status === "passed" || account.status === "completed") return;

    // ── (b) No open trades ───────────────────────────────────────────────────
    const openCount = await OpenTrade.countDocuments({
      tradingAccount: account._id,
      isPending:      false,
    });
    if (openCount > 0) return;

    // ── (c) Profit target reached ────────────────────────────────────────────
    const targetBalance = parseFloat(
      (startBal * (1 + profitTarget / 100)).toFixed(2)
    );
    if (balance < targetBalance) return;

    // ── (d) Minimum trading days ─────────────────────────────────────────────
    if (minDays > 0) {
      const trades = await TradeHistory.find(
        { tradingAccount: account._id },
        { closeTime: 1 }
      ).lean();

      const daySet = new Set(
        trades
          .map((t) => parseMfxDate(t.closeTime))
          .filter(Boolean)
          .map((d) => d.toISOString().split("T")[0])
      );

      if (daySet.size < minDays) return;
    }

    // ── All conditions met → pass the account ────────────────────────────────
    const nextPhase = account.challengeConfig?.nextPhase ?? null;
    await passAccount(account._id, nextPhase);

  } catch (err) {
    console.error(`[checkChallengePass] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// runAllChecks — single account
// ─────────────────────────────────────────────────────────────────────────────
const runAllChecks = async (account) => {
  if (await isAccountFailed(account._id)) return;

  // Run sequentially for safety
  await checkWeekendHold(account);
  await checkDailyDrawdown(account);
  await checkMaxDrawdown(account);
  await checkNewsTrading(account);
  await checkLotSize(account);
  await checkBalanceBreach(account);

  if (await isAccountFailed(account._id)) return;

  await checkChallengePass(account);
};

// ─────────────────────────────────────────────────────────────────────────────
// runAllChecksForAccounts — CRON ENTRY POINT
// ─────────────────────────────────────────────────────────────────────────────
const runAllChecksForAccounts = async (accounts) => {
  await warmCache();
  await Promise.allSettled(accounts.map((account) => runAllChecks(account)));
};

module.exports = {
  runAllChecksForAccounts,
  runAllChecks,
  checkWeekendHold,
  checkDailyDrawdown,
  checkMaxDrawdown,
  checkNewsTrading,
  checkLotSize,
  checkBalanceBreach,
};