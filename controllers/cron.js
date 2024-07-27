const cron = require('node-cron');
const Order = require('../models/order');
const connectDB = require("../config/db")

connectDB()

const OrderComplete = async () => {
    try {
        console.log('===cron working===');
        const currentDate = new Date();
        await Order.updateMany({ eventDate: { $lt: currentDate } ,status:'Confirmed'},{$set:{status:'Completed'}})
    } catch (error) {
        console.error('Error deleting expired subscriptions:', error);
    }
};

cron.schedule('0 18 * * *', () => {
    OrderComplete();
});