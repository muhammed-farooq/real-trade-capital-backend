// jobs/syncTradingAccounts.js
const TradingAccount = require("../../models/dashboard/tradingAcc");
const MyFxSession    = require("../../models/dashboard/myfxSession");
const OpenTrade      = require("../../models/dashboard/openTrade");
const TradeHistory   = require("../../models/dashboard/tradeHistory");
const DailyGain      = require("../../models/dashboard/dailyGain");
const DataDaily      = require("../../models/dashboard/dataDaily");

const MFX_BASE = "https://www.myfxbook.com/api";

const getSession = async () => {
  const doc = await MyFxSession.findOne({ email: process.env.MYFXBOOK_EMAIL }, { session: 1 });
  if (!doc?.session) return null;
  return decodeURIComponent(doc.session);
};

const mfxGet = (endpoint, params) => new Promise((resolve, reject) => {
  const https = require("https");
  const { session, ...rest } = params;
  const encodedSession = encodeURIComponent(session);
  const extraParams = new URLSearchParams(rest).toString();
  const url = `${MFX_BASE}/${endpoint}?session=${encodedSession}${extraParams ? "&" + extraParams : ""}`;

  https.get(url, (res) => {
    let raw = "";
    res.on("data", (chunk) => raw += chunk);
    res.on("end", () => {
      try {
        const data = JSON.parse(raw);
        if (data.error) return reject(new Error(`MyfxBook ${endpoint}: ${data.message}`));
        resolve(data);
      } catch (e) {
        reject(new Error(`MyfxBook ${endpoint}: failed to parse response`));
      }
    });
  }).on("error", reject);
});

const today   = ()  => new Date().toISOString().split("T")[0];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split("T")[0]; };

// ── Concurrency limiter ───────────────────────────────────────────────────────
// Runs tasks in batches of `limit` to avoid hammering MyfxBook API
const pLimit = (tasks, limit) => {
  return new Promise((resolve) => {
    const results = [];
    let started = 0, finished = 0;
    const total = tasks.length;
    if (total === 0) return resolve([]);

    const run = () => {
      while (started < total && started - finished < limit) {
        const i = started++;
        Promise.resolve()
          .then(() => tasks[i]())
          .then(r => { results[i] = { status: "fulfilled", value: r }; })
          .catch(e => { results[i] = { status: "rejected",  reason: e }; })
          .finally(() => { finished++; if (finished === total) resolve(results); else run(); });
      }
    };
    run();
  });
};

// ── syncOne ───────────────────────────────────────────────────────────────────
// mfxAccountsMap: pre-fetched map of login -> mfxAccount (avoids N calls to get-my-accounts)
const syncOne = async (account, session, mfxAccountsMap) => {
  const accId = account._id;
  const start = daysAgo(365);
  const end   = today();

  // ── Resolve myfxbookId using pre-fetched accounts map ────────────────────
  let mfxId = account.myfxbookId;

  const mfx = mfxAccountsMap.get(String(account.login));

  if (mfx) {
    // Update all account stats from the pre-fetched data
    Object.assign(account, {
      name:          mfx.name,
      balance:       mfx.balance        ?? 0,
      equity:        mfx.equity         ?? 0,
      equityPercent: mfx.equityPercent  ?? 0,
      profit:        mfx.profit         ?? 0,
      gain:          mfx.gain           ?? 0,
      absGain:       mfx.absGain        ?? 0,
      daily:         mfx.daily          ?? 0,
      monthly:       mfx.monthly        ?? 0,
      drawdown:      mfx.drawdown       ?? 0,
      deposits:      mfx.deposits       ?? 0,
      withdrawals:   mfx.withdrawals    ?? 0,
      interest:      mfx.interest       ?? 0,
      commission:    mfx.commission     ?? 0,
      currency:      mfx.currency       ?? "USD",
      profitFactor:  mfx.profitFactor   ?? 0,
      pips:          mfx.pips           ?? 0,
      demo:          mfx.demo           ?? false,
      server:        mfx.server?.name   ?? account.server,
      lastUpdateDate: mfx.lastUpdateDate,
      creationDate:   mfx.creationDate,
      firstTradeDate: mfx.firstTradeDate,
    });

    if (!mfxId) {
      account.myfxbookId = mfx.id;
      mfxId = mfx.id;
      console.log(`[syncOne] resolved myfxbookId=${mfxId} for login=${account.login}`);
    }

    // Daily high balance reset/update
    const storedDay = account.dailyHighBalanceDate?.toISOString?.()?.split("T")[0];
    if (storedDay !== today()) {
      account.dailyHighBalance     = mfx.balance;
      account.dailyHighBalanceDate = new Date();
    } else if (mfx.balance > (account.dailyHighBalance ?? 0)) {
      account.dailyHighBalance = mfx.balance;
    }
  }

  if (!mfxId) {
    console.error(`[syncOne] cannot sync — myfxbookId not found for login=${account.login}`);
    return;
  }

  // ── Fetch per-account endpoints in parallel ───────────────────────────────
  const [openRes, ordersRes, historyRes, gainRes, dailyRes] =
    await Promise.allSettled([
      mfxGet("get-open-trades.json", { session, id: mfxId }),
      mfxGet("get-open-orders.json", { session, id: mfxId }),
      mfxGet("get-history.json",     { session, id: mfxId }),
      mfxGet("get-daily-gain.json",  { session, id: mfxId, start, end }),
      mfxGet("get-data-daily.json",  { session, id: mfxId, start, end }),
    ]);

  // Log unexpected failures (open-orders excluded — not always enabled)
  [openRes, historyRes, gainRes, dailyRes].forEach((r, i) => {
    const names = ["get-open-trades", "get-history", "get-daily-gain", "get-data-daily"];
    if (r.status === "rejected") console.error(`[syncOne] ${names[i]} FAILED:`, r.reason?.message ?? r.reason);
  });

  // ── 2. Open trades ────────────────────────────────────────────────────────
  if (openRes.status === "fulfilled") {
    const trades = openRes.value.openTrades ?? [];
    await OpenTrade.deleteMany({ tradingAccount: accId, isPending: false });
    if (trades.length) {
      await OpenTrade.insertMany(trades.map((t) => ({
        tradingAccount: accId,
        symbol:    t.symbol,
        action:    t.action,
        lots:      parseFloat(t.sizing?.value ?? t.lots ?? 0),
        openPrice: t.openPrice,
        tp:        t.tp   ?? 0,
        sl:        t.sl   ?? 0,
        profit:    parseFloat(t.profit ?? 0),
        pips:      parseFloat(t.pips   ?? 0),
        swap:      parseFloat(t.swap   ?? 0),
        comment:   t.comment  ?? "",
        openTime:  t.openTime,
        isPending: false,
      })));
    }
    account.floatingPnl = trades.reduce((s, t) => s + parseFloat(t.profit ?? 0), 0);
  }

  // ── 3. Open orders (optional) ─────────────────────────────────────────────
  if (ordersRes.status === "fulfilled") {
    const orders = ordersRes.value.openOrders ?? [];
    await OpenTrade.deleteMany({ tradingAccount: accId, isPending: true });
    if (orders.length) {
      await OpenTrade.insertMany(orders.map((t) => ({
        tradingAccount: accId,
        symbol:    t.symbol,
        action:    t.action,
        lots:      parseFloat(t.sizing?.value ?? t.lots ?? 0),
        openPrice: t.openPrice,
        tp:        t.tp ?? 0,
        sl:        t.sl ?? 0,
        profit:    0,
        pips:      0,
        swap:      0,
        comment:   t.comment ?? "",
        openTime:  t.openTime,
        isPending: true,
      })));
    }
  }

  // ── 4. Trade history ──────────────────────────────────────────────────────
  if (historyRes.status === "fulfilled") {
    const history = historyRes.value.history ?? [];
    if (history.length) {
      await TradeHistory.bulkWrite(
        history.map((t) => ({
          updateOne: {
            filter: {
              tradingAccount: accId,
              openTime:  t.openTime,
              closeTime: t.closeTime,
              symbol:    t.symbol,
              action:    t.action,
            },
            update: { $set: {
              tradingAccount: accId,
              symbol:     t.symbol,
              action:     t.action,
              lots:       parseFloat(t.sizing?.value ?? t.lots ?? 0),
              openPrice:  t.openPrice,
              closePrice: t.closePrice,
              tp:         t.tp   ?? 0,
              sl:         t.sl   ?? 0,
              profit:     parseFloat(t.profit      ?? 0),
              pips:       parseFloat(t.pips        ?? 0),
              swap:       parseFloat(t.interest    ?? t.swap ?? 0),
              commission: parseFloat(t.commission  ?? 0),
              comment:    t.comment   ?? "",
              openTime:   t.openTime,
              closeTime:  t.closeTime,
            }},
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }
  }

  // ── 5. Daily gain ─────────────────────────────────────────────────────────
  if (gainRes.status === "fulfilled") {
    const rawGain = gainRes.value.dailyGain ?? [];
    const rows = rawGain.map((r) => Array.isArray(r) ? r[0] : r).filter(Boolean);
    if (rows.length) {
      await DailyGain.bulkWrite(
        rows.map((d) => ({
          updateOne: {
            filter: { tradingAccount: accId, date: d.date },
            update: { $set: {
              tradingAccount: accId,
              date:   d.date,
              value:  parseFloat(d.value  ?? 0),
              profit: parseFloat(d.profit ?? 0),
            }},
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }
  }

  // ── 6. Data daily ─────────────────────────────────────────────────────────
  if (dailyRes.status === "fulfilled") {
    const rawDaily = dailyRes.value.dataDaily ?? [];
    const rows = rawDaily.map((r) => Array.isArray(r) ? r[0] : r).filter(Boolean);
    if (rows.length) {
      await DataDaily.bulkWrite(
        rows.map((d) => ({
          updateOne: {
            filter: { tradingAccount: accId, date: d.date },
            update: { $set: {
              tradingAccount: accId,
              date:    d.date,
              balance: parseFloat(d.balance  ?? 0),
              profit:  parseFloat(d.profit   ?? 0),
              pips:    parseFloat(d.pips     ?? 0),
              lots:    parseFloat(d.lots     ?? 0),
            }},
            upsert: true,
          },
        })),
        { ordered: false }
      );
    }
  }

  // ── 7. Save ───────────────────────────────────────────────────────────────
  account.status    = "active";
  account.lastSync  = new Date();
  account.syncError = undefined;
  await account.save();
};

// ── syncAllAccounts ───────────────────────────────────────────────────────────
const CONCURRENCY = 5; // max accounts synced simultaneously — safe for MyfxBook

const syncAllAccounts = async () => {
  try {
    const session = await getSession();
    if (!session) { console.log("[sync] no session found"); return; }

    const accounts = await TradingAccount.find({
      status: { $in: ["active", "pending"] },
      login:  { $exists: true, $ne: null },
    });

    if (!accounts.length) { console.log("[sync] no active accounts"); return; }

    // ── Fetch get-my-accounts ONCE for all accounts ───────────────────────
    // Builds a Map of login -> mfxAccount to avoid N redundant API calls
    let mfxAccountsMap = new Map();
    try {
      const data = await mfxGet("get-my-accounts.json", { session });
      (data.accounts ?? []).forEach((a) => {
        mfxAccountsMap.set(String(a.accountId), a);
      });
      console.log(`[sync] fetched ${mfxAccountsMap.size} MyfxBook accounts`);
    } catch (err) {
      console.error("[sync] get-my-accounts FAILED:", err.message);
      // Continue anyway — accounts with existing myfxbookId can still sync
    }

    console.log(`[sync] syncing ${accounts.length} accounts (concurrency=${CONCURRENCY})...`);

    // ── Run with concurrency limit ────────────────────────────────────────
    const tasks = accounts.map((acc) => () =>
      syncOne(acc, session, mfxAccountsMap).catch((err) => {
        console.error(`[sync] failed ${acc._id}:`, err.message);
        acc.status    = "failed";
        acc.syncError = err.message;
        return acc.save().catch(() => {});
      })
    );

    await pLimit(tasks, CONCURRENCY);

    console.log("[sync] done");
  } catch (err) {
    console.error("[syncAllAccounts]", err.message);
  }
};

module.exports = { syncAllAccounts, syncOne };