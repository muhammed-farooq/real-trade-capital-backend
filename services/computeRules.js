// services/computeRules.js
// Derives the challenge rules object from live account data + your challenge config.
// challengeConfig comes from YOUR database (e.g. order.challengeConfig).

const { toDateKey, getLots } = require("./computeStats");

/**
 * Check if a MyFxBook datetime string falls on a weekend (Saturday or Sunday).
 * Format: "03/01/2010 10:14"
 */
function isWeekend(dtStr) {
  if (!dtStr) return false;
  try {
    const date = dtStr.includes("T") ? new Date(dtStr) : new Date(dtStr.replace(" ", "T"));
    const day = date.getDay(); // 0 = Sun, 6 = Sat
    return day === 0 || day === 6;
  } catch {
    return false;
  }
}

/**
 * Detect weekend holding violations:
 * A trade is a violation if openTime is on a weekday but closeTime is on a weekend,
 * OR if the trade was still open going into the weekend (no closeTime yet and opened before Fri EOD).
 */
function detectWeekendHolding(openTrades = [], tradeHistory = []) {
  // Check closed trades — did any close on a weekend?
  const closedOnWeekend = tradeHistory.some(t => isWeekend(t.closeTime));
  if (closedOnWeekend) return true;

  // Check open trades — are any still open and today is weekend?
  if (openTrades.length > 0) {
    const now = new Date();
    const dayNow = now.getDay();
    if (dayNow === 0 || dayNow === 6) return true;
  }

  return false;
}

/**
 * Detect news trading violations.
 * Without a news feed you can't do this automatically.
 * Placeholder — integrate with ForexFactory or MyFxBook news API if needed.
 * For now, returns false (clean). Override with your own logic.
 */
function detectNewsTrading(/*openTrades, tradeHistory, newsEvents*/) {
  return false;
}

/**
 * Main function.
 *
 * @param {Object} accountData      Full account document from your DB
 *   - balance            Current balance (from MyFxBook)
 *   - equity             Current equity
 *   - startingBalance    Stored at account creation
 *   - dailyHighBalance   Peak balance today (you track this in syncAccount)
 *   - profit             Total profit (from MyFxBook get-my-accounts)
 *
 * @param {Object} challengeConfig  Your challenge config stored in DB
 *   - maxDailyLoss        e.g. -5   (percent, negative)
 *   - maxTotalLoss        e.g. -10  (percent, negative)
 *   - profitTarget        e.g.  10  (percent, positive)
 *   - minTradingDays      e.g.  10
 *   - maxLotSize          e.g.  5
 *
 * @param {Array}  tradeHistory     Full history from DB
 * @param {Array}  openTrades       Current open trades from DB
 *
 * @returns {Object}  rules object matching AccountPerformance.jsx shape
 */
function computeRules(accountData, challengeConfig, tradeHistory = [], openTrades = []) {
  const {
    balance          = 0,
    startingBalance  = balance,
    dailyHighBalance = balance,
    profit           = 0,
  } = accountData;

  const {
    maxDailyLoss    = -5,
    maxTotalLoss    = -10,
    profitTarget    = 10,
    minTradingDays  = 10,
    maxLotSize      = 5,
  } = challengeConfig;

  // ── Daily Drawdown ────────────────────────────────────────────────────────
  // How much has balance dropped from today's peak, as % of starting balance
  const dailyDrop = dailyHighBalance - balance;
  const currentDailyLoss = startingBalance > 0
    ? -((dailyDrop / startingBalance) * 100)
    : 0;

  // Passed = we haven't exceeded the limit (currentDailyLoss is less negative than maxDailyLoss)
  // e.g.  currentDailyLoss = -1.82,  maxDailyLoss = -5  → passed (−1.82 > −5)
  const dailyLossPassed = currentDailyLoss >= maxDailyLoss;

  // ── Total / Max Drawdown ──────────────────────────────────────────────────
  const totalDrop = startingBalance - balance;
  const currentTotalLoss = startingBalance > 0
    ? -((totalDrop / startingBalance) * 100)
    : 0;
  const totalLossPassed = currentTotalLoss >= maxTotalLoss;

  // ── Profit Target ─────────────────────────────────────────────────────────
  const currentProfit = startingBalance > 0
    ? (profit / startingBalance) * 100
    : 0;
  const profitTargetPassed = currentProfit >= profitTarget;

  // ── Trading Days ──────────────────────────────────────────────────────────
  const tradingDaySet = new Set();
  tradeHistory.forEach(t => {
    const dk = toDateKey(t.closeTime);
    if (dk) tradingDaySet.add(dk);
  });
  const currentTradingDays = tradingDaySet.size;
  const tradingDaysPassed  = currentTradingDays >= minTradingDays;

  // ── Max Lot Size ──────────────────────────────────────────────────────────
  const allTrades = [...openTrades, ...tradeHistory];
  const lotSizes  = allTrades.map(t => getLots(t)).filter(v => v > 0);
  const currentMaxLot = lotSizes.length ? Math.max(...lotSizes) : 0;
  const lotSizePassed = currentMaxLot <= maxLotSize;

  // ── Special Rules ─────────────────────────────────────────────────────────
  const weekendHolding = detectWeekendHolding(openTrades, tradeHistory);
  const newsTrading    = detectNewsTrading();

  return {
    // Daily drawdown
    currentDailyLoss:  parseFloat(currentDailyLoss.toFixed(2)),
    maxDailyLoss,
    dailyLossPassed,

    // Total drawdown
    currentTotalLoss:  parseFloat(currentTotalLoss.toFixed(2)),
    maxTotalLoss,
    totalLossPassed,

    // Profit target
    currentProfit:     parseFloat(currentProfit.toFixed(2)),
    profitTarget,
    profitTargetPassed,

    // Trading days
    currentTradingDays,
    minTradingDays,
    tradingDaysPassed,

    // Lot size
    currentMaxLot:     parseFloat(currentMaxLot.toFixed(2)),
    maxLotSize,
    lotSizePassed,

    // Special
    newsTrading,
    weekendHolding,
  };
}

module.exports = { computeRules, detectWeekendHolding };