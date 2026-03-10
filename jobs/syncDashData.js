const cron = require('node-cron');
const { syncAllAccounts } = require("../controllers/analytics/syncData");

cron.schedule('*/25 * * * *', async () => {
    console.log('Sync all accounts data');
    await syncAllAccounts();
});