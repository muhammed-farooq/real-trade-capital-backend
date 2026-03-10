const cron = require('node-cron');
const axios = require('axios');
require('dotenv').config();

let latestSession = 'vVMsG8Pc4fgwyF5qVusu3898907';

const updateMyFxBookSession = async () => {
    try {
        const response = await axios.get(
            `https://www.myfxbook.com/api/login.json?email=${process.env.MYFXBOOK_EMAIL}&password=${process.env.MYFXBOOK_PASSWORD}`
        );
        console.log(response.data);
        
        latestSession = response.data.session;
        console.log("Latest Session:", latestSession);
        return latestSession;
    } catch (error) {
        console.error("Error updating MyFxBook session:", error);
    }
};

const fetchMyAccounts= async ()=>{
    try {
        const response = await axios.get(`https://www.myfxbook.com/api/get-my-accounts.json?session=${latestSession}`)

        console.log(response.data);

        return response.data.accounts    //array of objects
    } catch (error) {
        console.error("Error fetching accounts:", error);
    }
}

const getOpenTrades = async(id)=>{
    try {
        const response  = await axios(`https://www.myfxbook.com/api/get-open-trades.json?session=${latestSession}&id=${id}`)
        console.log(response.data);
        
        return response.data
    } catch (error) {
        console.error("Error fetching open trades:", error);
    }
}

const getTradeHistory = async(id)=>{
    try {
        const response  = await axios(`https://www.myfxbook.com/api/get-history.json?session=${latestSession}&id=${id}`)
        console.log(response.data);
        
        return response.data
    } catch (error) {
        console.error("Error fetching trade history:", error);
    }
}

const getDailyGain = async(id)=>{
    try {
        const response = await axios(`https://www.myfxbook.com/api/get-daily-gain.json?session=${latestSession}&id=${id}&start=2000-01-01&end=2025-03-12`)

        console.log(response.data);
        
        return response.data
    } catch (error) {
        console.error("Error fetching trade history:", error);
    }
}

const getWeeklyNews = async(id)=>{
    try {
        const response = await axios(`https://nfs.faireconomy.media/ff_calendar_thisweek.json`)

        console.log(response.data);
        
        return response.data
    } catch (error) {
        console.error("Error fetching trade history:", error);
    }
}

const getDataDaily=async()=>{
    try {
        const response = await axios(`https://www.myfxbook.com/api/get-data-daily.json?session=${latestSession}&id=12345&start=2000-01-01&end=2025-04-01`)
        console.log(response.data);
        
        return response.data
    } catch (error) {
        console.error("Error fetching trade history:", error);
    }
}



