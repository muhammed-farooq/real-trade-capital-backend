const dotenv = require("dotenv");
dotenv.config();
const MyFxSession = require('../../models/dashboard/myfxSession');
const axios = require("axios");
let latestSession = null;
const email = process.env.MYFXBOOK_EMAIL
const pass = process.env.MYFXBOOK_PASSWORD

const updateMyFxBookSession = async () => {
  try {
    const { data } = await axios.get(`https://www.myfxbook.com/api/login.json?email=${email}&password=${pass}`);

    if (data.error) {
      throw new Error(data.message || "MyFxBook login failed");
    }

    latestSession = data.session;
    
    await MyFxSession.updateOne(
        { 
            email: process.env.MYFXBOOK_EMAIL,
            password : process.env.MYFXBOOK_PASSWORD
        },
        { $set: { session: latestSession } },
        { upsert: true }
    );

    console.log("MyFxBook session updated");

    return latestSession;
  } catch (error) {
    console.error("Error updating MyFxBook session:", error);
  }
};

const fetchSession = async(req,res)=>{
  try {
    const res = await MyFxSession.findOne({email},{session :1 })
    return res.session
  } catch (error) {
    console.error("Err fetching myfxbook session:", error);
  }
}

module.exports = {
    updateMyFxBookSession,
    fetchSession
}