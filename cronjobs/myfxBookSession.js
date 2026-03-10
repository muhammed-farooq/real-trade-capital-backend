const cron = require('node-cron');
const { updateMyFxBookSession } = require('../controllers/analytics/myfxbookSession');

cron.schedule('*/15 * * * *', async () => {
    console.log('Session updated');
    await updateMyFxBookSession();
});

updateMyFxBookSession()