const cron = require('node-cron');
const { updateMyFxBookSession } = require("../controllers/analytics/session");

cron.schedule('*/14 * * * *', async () => {
    console.log('Session updated');
    await updateMyFxBookSession();
});