// services/syncAccount.js
// Fetches all data from MyFxBook for one account and persists it to MongoDB.
// Called by: cron job (every 15 min) + on-demand via /account-dashboard/:id/sync

const myfx        = require("./myfxbook");
const { computeStats }   = require("./computeStats");
const { computeRules }   = require("./computeRules");

// ── Import your Mongoose models ───────────────────────────────────────────────
// Adjust paths to match your project structure
const TradingAccount = require("../models/TradingAccount");   // main account doc
const OpenTrade      = require("../models/OpenTrade");
const TradeHistory   = require("../models/TradeHistory");
const DailyGain      = require("../models/DailyGain");
const DataDaily      = require("../models/DataDaily");

/**
 * Format today and a past date as "YYYY-MM-DD" for MyFxBook date params.
 */
function dateRange(daysBack = 365) {
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  const fmt = (d) => d.toISOString().split("T")[0];
  return { start: fmt(start), end: fmt(end) };
}

/**
 * Transform a raw MyFxBook open trade into your DB shape.
 */
function transformOpenTrade(t, accountId) {
  return {
    accountId,
    symbol:    t.symbol,
    action:    t.action,
    lots:      parseFloat(t.sizing?.value ?? t.lots ?? 0),
    openPrice: t.openPrice,
    tp:        t.tp ?? 0,
    sl:        t.sl ?? 0,
    profit:    parseFloat(t.profit ?? 0),
    pips:      parseFloat(t.pips ?? 0),
    swap:      parseFloat(t.swap ?? 0),
    comment:   t.comment ?? "",
    openTime:  t.openTime,
    magic:     t.magic ?? null,
  };
}

/**
 * Transform a raw MyFxBook history trade into your DB shape.
 */
function transformHistoryTrade(t, accountId) {
  return {
    accountId,
    symbol:     t.symbol,
    action:     t.action,
    lots:       parseFloat(t.sizing?.value ?? t.lots ?? 0),
    openPrice:  t.openPrice,
    closePrice: t.closePrice,
    tp:         t.tp  ?? 0,
    sl:         t.sl  ?? 0,
    profit:     parseFloat(t.profit ?? 0),
    pips:       parseFloat(t.pips   ?? 0),
    swap:       parseFloat(t.interest ?? t.swap ?? 0),
    commission: parseFloat(t.commission ?? 0),
    comment:    t.comment  ?? "",
    openTime:   t.openTime,
    closeTime:  t.closeTime,
  };
}

/**
 * Core sync function.
 *
 * @param {Object}  accountDoc   Mongoose document from TradingAccount collection
 *   Required fields on accountDoc:
 *     _id, myfxbookId, myfxbookSession, startingBalance,
 *     challengeConfig, dailyHighBalance (tracked by us)
 *
 * @returns {Object}  The updated account document (plain object)
 */
async function syncAccount(accountDoc) {
  const session  = accountDoc.myfxbookSession; // decrypted before passing in
  const mfxId    = accountDoc.myfxbookId;
  const accId    = accountDoc._id;

  // ── 1. Fetch everything in parallel ───────────────────────────────────────
  const { start, end } = dateRange(365);

  const [
    myfxAccounts,
    openTrades,
    openOrders,
    history,
    dailyGain,
    dataDaily,
  ] = await Promise.all([
    myfx.getMyAccounts(session),
    myfx.getOpenTrades(session, mfxId),
    myfx.getOpenOrders(session, mfxId),
    myfx.getHistory(session, mfxId),
    myfx.getDailyGain(session, mfxId, start, end),
    myfx.getDataDaily(session, mfxId, start, end),
  ]);

  // Find the matching account from get-my-accounts
  const mfxAcc = myfxAccounts.find(a => a.id === mfxId || a.accountId === mfxId)
              ?? myfxAccounts[0];

  if (!mfxAcc) throw new Error(`Account ${mfxId} not found in MyFxBook response`);

  // ── 2. Track daily high balance ────────────────────────────────────────────
  // Reset at midnight; if current balance > today's high, update it
  const todayKey = new Date().toISOString().split("T")[0];
  const storedDayKey = accountDoc.dailyHighBalanceDate?.toISOString?.()?.split("T")[0];

  let dailyHighBalance = accountDoc.dailyHighBalance ?? mfxAcc.balance;
  if (storedDayKey !== todayKey) {
    // New day — reset high to current balance
    dailyHighBalance = mfxAcc.balance;
  } else if (mfxAcc.balance > dailyHighBalance) {
    dailyHighBalance = mfxAcc.balance;
  }

  // ── 3. Build the updated account fields ───────────────────────────────────
  const updatedAccount = {
    // From MyFxBook get-my-accounts
    name:            mfxAcc.name,
    balance:         mfxAcc.balance,
    equity:          mfxAcc.equity,
    profit:          mfxAcc.profit,
    gain:            mfxAcc.gain,
    absGain:         mfxAcc.absGain,
    daily:           parseFloat(mfxAcc.daily  ?? 0),
    monthly:         parseFloat(mfxAcc.monthly ?? 0),
    drawdown:        mfxAcc.drawdown,
    deposits:        mfxAcc.deposits,
    withdrawals:     mfxAcc.withdrawals,
    currency:        mfxAcc.currency,
    profitFactor:    mfxAcc.profitFactor,
    pips:            mfxAcc.pips,
    demo:            mfxAcc.demo,
    server:          mfxAcc.server?.name ?? accountDoc.server,
    lastUpdateDate:  mfxAcc.lastUpdateDate,

    // Tracked by us
    dailyHighBalance,
    dailyHighBalanceDate: new Date(),

    // Computed: floating P&L = sum of open trade profits
    floatingPnl: openTrades.reduce((s, t) => s + parseFloat(t.profit ?? 0), 0),

    // From your DB (not from MyFxBook)
    startingBalance:  accountDoc.startingBalance,
    challengeConfig:  accountDoc.challengeConfig,
    login:            accountDoc.login,
    leverage:         accountDoc.leverage,

    // Sync timestamp
    lastSync: new Date(),
  };

  // ── 4. Persist open trades (full replace — they change every sync) ─────────
  await OpenTrade.deleteMany({ accountId: accId });
  const allOpenEntries = [
    ...openTrades.map(t  => transformOpenTrade(t, accId)),
    ...openOrders.map(t  => transformOpenTrade(t, accId)),   // pending orders same shape
  ];
  if (allOpenEntries.length) await OpenTrade.insertMany(allOpenEntries);

  // ── 5. Persist trade history (upsert — never delete historical trades) ─────
  if (history.length) {
    const bulkOps = history.map(t => ({
      updateOne: {
        filter: {
          accountId: accId,
          openTime:  t.openTime,
          closeTime: t.closeTime,
          symbol:    t.symbol,
          action:    t.action,
        },
        update: { $set: transformHistoryTrade(t, accId) },
        upsert: true,
      },
    }));
    await TradeHistory.bulkWrite(bulkOps, { ordered: false });
  }

  // ── 6. Persist daily gain (replace whole array — it's cumulative) ──────────
  await DailyGain.findOneAndUpdate(
    { accountId: accId },
    {
      accountId: accId,
      data: dailyGain.map(d => ({
        date:   d.date,
        value:  parseFloat(d.value  ?? 0),
        profit: parseFloat(d.profit ?? 0),
      })),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // ── 7. Persist data daily (replace — balance curve, same logic) ───────────
  await DataDaily.findOneAndUpdate(
    { accountId: accId },
    {
      accountId: accId,
      data: dataDaily.map(d => ({
        date:        d.date,
        balance:     parseFloat(d.balance  ?? 0),
        profit:      parseFloat(d.profit   ?? 0),
        pips:        parseFloat(d.pips     ?? 0),
        lots:        parseFloat(d.lots     ?? 0),
        floatingPL:  parseFloat(d.floatingPL ?? 0),
      })),
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // ── 8. Save updated account back to DB ────────────────────────────────────
  const saved = await TradingAccount.findByIdAndUpdate(
    accId,
    { $set: updatedAccount },
    { new: true }
  );

  return saved;
}

module.exports = { syncAccount };