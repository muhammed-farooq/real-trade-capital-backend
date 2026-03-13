const TradingAccount = require("../models/dashboard/tradingAcc");
const { runAllChecks } = require("./checks/ruleChecks");

// ── Simple concurrency limiter (same pattern as syncTradingAccounts) ──────────
const pLimit = (tasks, limit) =>
  new Promise((resolve) => {
    const results = [];
    let started = 0, finished = 0;
    const total = tasks.length;
    if (total === 0) return resolve([]);
    const run = () => {
      while (started < total && started - finished < limit) {
        const i = started++;
        Promise.resolve()
          .then(() => tasks[i]())
          .then((r)  => { results[i] = { status: "fulfilled", value: r }; })
          .catch((e) => { results[i] = { status: "rejected",  reason: e }; })
          .finally(() => { finished++; if (finished === total) resolve(results); else run(); });
      }
    };
    run();
  });

const CONCURRENCY = 8;

const checkAccountRules = async () => {
  const startedAt = Date.now();
  console.log(`[checkAccountRules] starting at ${new Date().toISOString()}`);

  try {
    const accounts = await TradingAccount.find(
      {
        status: { $in: ["active", "funded"] },
        login:  { $exists: true, $ne: null },
      },
      {
        login: 1, user: 1, stage: 1,
        balance: 1, equity: 1,
        startingBalance: 1,
        dailyHighBalance: 1, dailyHighBalanceDate: 1,
        lastUpdateDate: 1,
        challengeConfig: 1,
        myfxbookId: 1,
      }
    ).lean();   

    if (!accounts.length) {
      console.log("[checkAccountRules] no accounts to check");
      return;
    }

    console.log(`[checkAccountRules] checking ${accounts.length} accounts (concurrency=${CONCURRENCY})`);

    const tasks = accounts.map((acc) => async () => {
      try {
        await runAllChecks(acc);
      } catch (err) {
        console.error(`[checkAccountRules] unhandled error for account ${acc._id}:`, err.message);
      }
    });

    await pLimit(tasks, CONCURRENCY);

    console.log(`[checkAccountRules] done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error("[checkAccountRules] fatal error:", err.message);
  }
};

module.exports = { checkAccountRules };