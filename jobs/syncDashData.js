// jobs/cron.js
const cron = require("node-cron");
const { syncAllAccounts }        = require("../controllers/analytics/syncData");
const { updateMyFxBookSession }  = require("../controllers/analytics/session");

cron.schedule("*/15 * * * *", async () => {
  try {
    await updateMyFxBookSession();
    console.log("[cron] session refreshed");

    await new Promise(r => setTimeout(r, 5000));

    await syncAllAccounts();
  } catch (err) {
    console.error("[cron] error:", err.message);
  }
});

console.log("[cron] scheduler started — runs every 15 min");