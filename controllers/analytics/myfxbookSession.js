const dotenv = require("dotenv");
dotenv.config();

const MyFxSession = require("../../models/dashboard/myfxSession");
const axios = require("axios");

let latestSession = null;

const email = process.env.MYFXBOOK_EMAIL;
const pass = process.env.MYFXBOOK_PASSWORD;

const updateMyFxBookSession = async () => {
  try {
    const { data } = await axios.get(
      "https://www.myfxbook.com/api/login.json",
      {
        params: {
          email,
          password: pass,
        },
      }
    );

    if (data.error) {
      throw new Error(data.message || "MyFxBook login failed");
    }

    latestSession = data.session;

    await MyFxSession.updateOne(
      { email },
      {
        $set: {
          email,
          session: latestSession,
        },
      },
      { upsert: true }
    );

    console.log("MyFxBook session updated");
    return latestSession;
  } catch (error) {
    console.error("Error updating MyFxBook session:", error.message);
    return null;
  }
};

const fetchSession = async () => {
  try {
    const sessionDoc = await MyFxSession.findOne(
      { email },
      { session: 1, _id: 0 }
    );

    return sessionDoc?.session || null;
  } catch (error) {
    console.error("Error fetching MyFxBook session:", error.message);
    return null;
  }
};

module.exports = {
  updateMyFxBookSession,
  fetchSession,
};