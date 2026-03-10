// services/computeStats.js
// Derives the full stats object from a raw MyFxBook history array.
// Call this after fetching get-history and saving it to DB.

/**
 * Parse a MyFxBook lot value which lives inside sizing.value.
 * e.g.  trade.sizing.value = "0.5"  OR  trade.lots = 0.5
 */
function getLots(trade) {
  if (trade.sizing?.value != null) return parseFloat(trade.sizing.value) || 0;
  if (trade.lots         != null) return parseFloat(trade.lots)          || 0;
  return 0;
}

/**
 * Extract the calendar date string "YYYY-MM-DD" from a MyFxBook datetime.
 * MyFxBook format: "03/01/2010 10:14"  →  "2010-03-01"
 */
function toDateKey(dtStr) {
  if (!dtStr) return null;
  // Handle both "03/01/2010 10:14" and ISO strings
  if (dtStr.includes("T")) return dtStr.split("T")[0];
  const [datePart] = dtStr.split(" ");
  const [mm, dd, yyyy] = datePart.split("/");
  if (!yyyy) return null;
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
}

/**
 * Main function.
 * @param {Array}  history        Full get-history array from MyFxBook
 * @param {number} minTradingDays From your challenge config
 * @returns {Object}              stats object matching AccountPerformance shape
 */
function computeStats(history = [], minTradingDays = 10) {
  if (!history.length) {
    return {
      totalTrades: 0, winTrades: 0, lossTrades: 0,
      winRate: 0, avgWin: 0, avgLoss: 0,
      bestTrade: 0, worstTrade: 0,
      profitFactor: 0, tradingDays: 0, minTradingDays,
    };
  }

  // ── Partition into wins / losses ──────────────────────────────────────────
  const wins   = history.filter(t => parseFloat(t.profit ?? 0) > 0);
  const losses = history.filter(t => parseFloat(t.profit ?? 0) < 0);

  const totalTrades = history.length;
  const winTrades   = wins.length;
  const lossTrades  = losses.length;
  const winRate     = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;

  // ── Averages ──────────────────────────────────────────────────────────────
  const avg = (arr, key) =>
    arr.length ? arr.reduce((s, t) => s + parseFloat(t[key] ?? 0), 0) / arr.length : 0;

  const avgWin  =  avg(wins,   "profit");
  const avgLoss =  avg(losses, "profit"); // will be negative

  // ── Best / worst ──────────────────────────────────────────────────────────
  const profits   = history.map(t => parseFloat(t.profit ?? 0));
  const bestTrade  = profits.length ? Math.max(...profits) : 0;
  const worstTrade = profits.length ? Math.min(...profits) : 0;

  // ── Profit factor  =  gross wins / |gross losses| ─────────────────────────
  const grossWin  = wins.reduce((s, t)   => s + parseFloat(t.profit ?? 0), 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + parseFloat(t.profit ?? 0), 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 999 : 0;

  // ── Trading days  =  unique closeTime calendar dates ─────────────────────
  const tradingDaySet = new Set();
  history.forEach(t => {
    const dk = toDateKey(t.closeTime);
    if (dk) tradingDaySet.add(dk);
  });
  const tradingDays = tradingDaySet.size;

  return {
    totalTrades,
    winTrades,
    lossTrades,
    winRate:       parseFloat(winRate.toFixed(2)),
    avgWin:        parseFloat(avgWin.toFixed(2)),
    avgLoss:       parseFloat(avgLoss.toFixed(2)),
    bestTrade:     parseFloat(bestTrade.toFixed(2)),
    worstTrade:    parseFloat(worstTrade.toFixed(2)),
    profitFactor:  parseFloat(profitFactor.toFixed(3)),
    tradingDays,
    minTradingDays,
  };
}

module.exports = { computeStats, toDateKey, getLots };