// jobs/cron.js
const cron = require("node-cron");
const { syncAllAccounts }       = require("../controllers/analytics/syncData");
const { updateMyFxBookSession } = require("../controllers/analytics/session");
const { checkAccountRules }     = require("../controllers/analytics/checkAccountRules");

const syncJob = async () => {
  try {
    await updateMyFxBookSession();
    console.log("[cron] session refreshed");

    // Give MyfxBook a moment after session update before fetching accounts
    await new Promise(r => setTimeout(r, 5000));

    await syncAllAccounts();
  } catch (err) {
    console.error("[cron-sync] error:", err.message);
  }
};

const rulesJob = async () => {
  try {
    await checkAccountRules();
  } catch (err) {
    console.error("[cron-rules] error:", err.message);
  }
};

const run = async () => {
  console.log("[cron] scheduler started");

  await syncJob();
  await rulesJob();

  cron.schedule("*/15 * * * *", syncJob);
  cron.schedule("*/10 * * * *", rulesJob);

  console.log("[cron] jobs scheduled — sync every 15 min, rules every 10 min");
};

run();