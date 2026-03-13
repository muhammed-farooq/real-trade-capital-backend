const OpenTrade    = require("../../models/dashboard/openTrade");
const TradeHistory = require("../../models/dashboard/tradeHistory");
const { saveWarning }          = require("../utils/saveWarning");
const { fetchHighImpactNews }  = require("../utils/fetchHighImpactNews");

const todayStr = () => new Date().toISOString().split("T")[0];

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: parse "YYYY.MM.DD HH:MM" or "YYYY-MM-DD HH:MM" → Date
// ─────────────────────────────────────────────────────────────────────────────
const parseMfxDate = (str) => {
  if (!str) return null;
  // normalise separators
  const iso = str.replace(/\./g, "-").replace(" ", "T") + ":00Z";
  const d   = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. WEEKEND HOLD
//    Run on Saturday nights — fires if the account has open trades
//    and lastUpdateDate falls on a Saturday.
// ─────────────────────────────────────────────────────────────────────────────
const checkWeekendHold = async (account) => {
  try {
    const now = new Date();
    // Only run on Saturday (6) — but guard with config flag too so callers
    // can force it in tests.
    const isSaturday = now.getUTCDay() === 6;
    if (!isSaturday) return;

    const openTrades = await OpenTrade.find(
      { tradingAccount: account._id, isPending: false },
      { symbol: 1, lots: 1, profit: 1 }
    ).lean();

    if (!openTrades.length) return;

    // Confirm lastUpdateDate is today (Saturday)
    const lastUpdate = account.lastUpdateDate
      ? new Date(account.lastUpdateDate)
      : null;
    const lastDay = lastUpdate?.toISOString().split("T")[0];
    if (lastDay !== todayStr()) return; // stale data — skip

    const dedupKey = `WEEKEND_HOLD:${todayStr()}`;
    const symbols  = openTrades.map((t) => t.symbol).join(", ");

    await saveWarning({
      tradingAccount: account._id,
      user:           account.user,
      type:           "WEEKEND_HOLD",
      severity:       "warning",
      title:          "Open Trades Held Over Weekend",
      message: `Your account has ${openTrades.length} open trade(s) heading into the weekend: ${symbols}. Positions are not allowed to be held over the weekend.`,   
      snapshot: {
        openTradeCount: openTrades.length,
        symbols,
        checkedAt:      now.toISOString(),
      },
      dedupKey,
    });

    console.log(`[checkWeekendHold] WARNING saved for account ${account._id}`);
  } catch (err) {
    console.error(`[checkWeekendHold] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2a. DAILY DRAWDOWN
// ─────────────────────────────────────────────────────────────────────────────
const checkDailyDrawdown = async (account) => {
  try {
    const cfg      = account.challengeConfig ?? {};
    const maxDaily = cfg.maxDailyLoss ?? 5; // %

    const startBal   = account.startingBalance ?? 0;
    const balance    = account.balance         ?? 0;
    const dailyHigh  = account.dailyHighBalance ?? balance;

    if (!startBal || !balance) return;

    const dailyLossPct = parseFloat(
      (((balance - dailyHigh) / startBal) * 100).toFixed(2)
    );

    if (dailyLossPct >= 0) return; // no daily loss

    const absDailyLoss = Math.abs(dailyLossPct);

    // ── Severity tiers ────────────────────────────────────────────────────
    let severity = null;
    if (absDailyLoss >= maxDaily) severity = "breach";

    if (!severity) return;

    const dedupKey = `DAILY_DD:${todayStr()}:${severity}`;

    await saveWarning({
      tradingAccount: account._id,
      user:           account.user,
      type:           "DAILY_DRAWDOWN",
      severity,
      title: "Daily Drawdown Limit BREACHED",
      message: `Daily drawdown has hit ${absDailyLoss.toFixed(2)}% — limit is ${maxDaily}%. Challenge rule breached.`,
      snapshot: {
        balance,
        dailyHigh,
        startBal,
        dailyLossPct,
        maxDailyLoss: maxDaily,
      },
      dedupKey,
    });
  } catch (err) {
    console.error(`[checkDailyDrawdown] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2b. MAX (TOTAL) DRAWDOWN
// ─────────────────────────────────────────────────────────────────────────────
const checkMaxDrawdown = async (account) => {
  try {
    const cfg      = account.challengeConfig ?? {};
    const maxTotal = cfg.maxTotalLoss ?? 10; // %

    const startBal = account.startingBalance ?? 0;
    const balance  = account.balance         ?? 0;

    if (!startBal || !balance) return;

    const totalLossPct = parseFloat(
      (Math.min(0, (balance - startBal) / startBal) * 100).toFixed(2)
    );

    if (totalLossPct >= 0) return;

    const absTotalLoss = Math.abs(totalLossPct);

    let severity = null;
    if (absTotalLoss >= maxTotal)            severity = "breach";;

    if (!severity) return;

    const dedupKey = `MAX_DD:${todayStr()}:${severity}`;

    await saveWarning({
      tradingAccount: account._id,
      user:           account.user,
      type:           "MAX_DRAWDOWN",
      severity,
      title: "Max Drawdown Limit BREACHED",
      message: `Total drawdown is ${absTotalLoss.toFixed(2)}% — limit is ${maxTotal}%. Challenge rule breached.`,
      snapshot: {
        balance,
        startBal,
        totalLossPct,
        maxTotalLoss: maxTotal,
      },
      dedupKey,
    });
  } catch (err) {
    console.error(`[checkMaxDrawdown] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. NEWS TRADING
//    Fetches today's high-impact news and checks if any trade was opened
//    OR closed within ±windowMinutes of the event time.
// ─────────────────────────────────────────────────────────────────────────────
const NEWS_WINDOW_MINUTES = 2; // minutes before/after news to flag

const checkNewsTrading = async (account) => {
  try {
    const cfg = account.challengeConfig ?? {};
    if (cfg.newsTrading === false) return; // explicitly allowed — skip check

    const newsEvents = await fetchHighImpactNews();
    if (!newsEvents.length) return;

    // Pull all of today's closed trades + current open trades
    const todayStart = new Date(todayStr() + "T00:00:00.000Z").getTime();
    const todayEnd   = todayStart + 86_400_000;

    const [closedToday, openTrades] = await Promise.all([
      TradeHistory.find(
        {
          tradingAccount: account._id,
          closeTime: {
            $gte: todayStr() + " 00:00",
            $lte: todayStr() + " 23:59",
          },
        },
        { symbol: 1, openTime: 1, closeTime: 1, profit: 1, lots: 1 }
      ).lean(),
      OpenTrade.find(
        { tradingAccount: account._id, isPending: false },
        { symbol: 1, openTime: 1 }
      ).lean(),
    ]);

    const windowMs = NEWS_WINDOW_MINUTES * 60 * 1000;

    for (const event of newsEvents) {
      const eventMs = event.timestamp;

      // Check closed trades
      for (const trade of closedToday) {
        const openMs  = parseMfxDate(trade.openTime)?.getTime();
        const closeMs = parseMfxDate(trade.closeTime)?.getTime();

        const openNearNews  = openMs  && Math.abs(openMs  - eventMs) <= windowMs;
        const closeNearNews = closeMs && Math.abs(closeMs - eventMs) <= windowMs;

        if (!openNearNews && !closeNearNews) continue;

        const when = openNearNews ? "opened" : "closed";
        const dedupKey = `NEWS:${event.date}:${event.time}:${trade.symbol}:${trade.openTime}`;

        await saveWarning({
          tradingAccount: account._id,
          user:           account.user,
          type:           "NEWS_TRADING",
          severity:       "warning",
          title:          `News Trading Detected — ${event.title}`,
          message:        `Trade on ${trade.symbol} was ${when} within ${NEWS_WINDOW_MINUTES} min of high-impact news "${event.title}" (${event.currency}, ${event.time} UTC).`,
          snapshot: {
            tradeSymbol: trade.symbol,
            openTime:    trade.openTime,
            closeTime:   trade.closeTime,
            newsTitle:   event.title,
            newsCurrency:event.currency,
            newsTime:    `${event.date} ${event.time} UTC`,
            when,
          },
          dedupKey,
        });
      }

      // Check currently open trades (opened near news)
      for (const trade of openTrades) {
        const openMs = parseMfxDate(trade.openTime)?.getTime();
        if (!openMs || Math.abs(openMs - eventMs) > windowMs) continue;

        const dedupKey = `NEWS:OPEN:${event.date}:${event.time}:${trade.symbol}:${trade.openTime}`;

        await saveWarning({
          tradingAccount: account._id,
          user:           account.user,
          type:           "NEWS_TRADING",
          severity:       "warning",
          title:          `News Trading Detected (Open Position) — ${event.title}`,
          message:        `Open trade on ${trade.symbol} was entered within ${NEWS_WINDOW_MINUTES} min of high-impact news "${event.title}" (${event.currency}, ${event.time} UTC).`,
          snapshot: {
            tradeSymbol: trade.symbol,
            openTime:    trade.openTime,
            newsTitle:   event.title,
            newsCurrency:event.currency,
            newsTime:    `${event.date} ${event.time} UTC`,
          },
          dedupKey,
        });
      }
    }
  } catch (err) {
    console.error(`[checkNewsTrading] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. LOT SIZE
//    Checks open trades + today's closed trades against the configured max.
// ─────────────────────────────────────────────────────────────────────────────
const checkLotSize = async (account) => {
  try {
    const cfg    = account.challengeConfig ?? {};
    const maxLot = cfg.maxLotSize ?? 5;

    // Only enforce on funded stage if caller wants — use account.stage field
    // If account.stage is set and not "funded", skip
    if (account.stage && account.stage !== "funded") return;

    const openTrades = await OpenTrade.find(
      { tradingAccount: account._id, isPending: false },
      { symbol: 1, lots: 1, openTime: 1 }
    ).lean();

    for (const trade of openTrades) {
      const lots = trade.lots ?? 0;
      if (lots <= maxLot) continue;

      const dedupKey = `LOT:${todayStr()}:${trade.symbol}:${trade.openTime}`;

      await saveWarning({
        tradingAccount: account._id,
        user:           account.user,
        type:           "LOT_SIZE",
        severity:       "warning",
        title:          `Lot Size Exceeded — ${trade.symbol}`,
        message:        `Open trade on ${trade.symbol} uses ${lots} lots — max allowed is ${maxLot}.`,
        snapshot: {
          symbol:   trade.symbol,
          lots,
          maxLot,
          openTime: trade.openTime,
        },
        dedupKey,
      });
    }
  } catch (err) {
    console.error(`[checkLotSize] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. BALANCE BREACH
//    If balance drops to or below the max-loss floor, mark as breach.
//    maxLossFloor = startingBalance * (1 - maxTotalLoss/100)
// ─────────────────────────────────────────────────────────────────────────────
const checkBalanceBreach = async (account) => {
  try {
    const cfg      = account.challengeConfig ?? {};
    const maxTotal = cfg.maxTotalLoss ?? 10; // %

    const startBal = account.startingBalance ?? 0;
    const balance  = account.balance         ?? 0;

    if (!startBal || !balance) return;

    const floor = parseFloat((startBal * (1 - maxTotal / 100)).toFixed(2));

    if (balance > floor) return;

    const dedupKey = `BALANCE_BREACH:${todayStr()}`;

    await saveWarning({
      tradingAccount: account._id,
      user:           account.user,
      type:           "BALANCE_BREACH",
      severity:       "breach",
      title:          "Account Balance Breach — Challenge Failed",
      message:        `Balance $${balance.toFixed(2)} has fallen to or below the max-loss floor of $${floor.toFixed(2)} (${maxTotal}% of starting balance $${startBal.toFixed(2)}).`,
      snapshot: {
        balance,
        floor,
        startBal,
        maxTotalLoss: maxTotal,
      },
      dedupKey,
    });

    console.warn(`[checkBalanceBreach] BREACH for account ${account._id} — balance $${balance} <= floor $${floor}`);
  } catch (err) {
    console.error(`[checkBalanceBreach] account=${account._id}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Run ALL checks for one account
// ─────────────────────────────────────────────────────────────────────────────
const runAllChecks = async (account) => {
  await Promise.allSettled([
    checkWeekendHold(account),
    checkDailyDrawdown(account),
    checkMaxDrawdown(account),
    checkNewsTrading(account),
    checkLotSize(account),
    checkBalanceBreach(account),
  ]);
};

module.exports = {
  runAllChecks,
  checkWeekendHold,
  checkDailyDrawdown,
  checkMaxDrawdown,
  checkNewsTrading,
  checkLotSize,
  checkBalanceBreach,
};