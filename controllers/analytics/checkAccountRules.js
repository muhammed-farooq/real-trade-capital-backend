// jobs/checkAccountRules.js
const TradingAccount = require("../../models/dashboard/tradingAccount");
const { runAllChecksForAccounts } = require("./checks/ruleChecks");

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
          .then((r)  => { results[i] = { status: "fulfilled", value: r };  })
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
        status: "active",                       // enum: active | failed | pending | completed
        login:  { $exists: true, $ne: null },   // must have an MT login
      },
      {
        _id: 1,
        userId: 1,
        login: 1,
        balance: 1, 
        equity: 1,
        startingBalance: 1,
        dailyHighBalance: 1, 
        dailyHighBalanceDate: 1,
        lastUpdateDate: 1,
        challengeConfig: 1,
        myfxbookId: 1,
      }
    ).lean();

    if (!accounts.length) {
      console.log("[checkAccountRules] no active accounts to check");
      return;
    }

    console.log(`[checkAccountRules] checking ${accounts.length} accounts (concurrency=${CONCURRENCY})`);

    // Warm the news cache once before fanning out — all accounts share one fetch
    await runAllChecksForAccounts(accounts);

    console.log(`[checkAccountRules] done in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
  } catch (err) {
    console.error("[checkAccountRules] fatal error:", err.message);
  }
};

module.exports = { checkAccountRules };