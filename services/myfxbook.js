// services/myfxbook.js
// Low-level wrapper around the MyFxBook REST API.
// Every method returns the parsed JSON or throws an error.

const axios = require("axios");

const BASE = "https://www.myfxbook.com/api";

/**
 * Build a query string from a plain object.
 */
function qs(params) {
  return Object.entries(params)
    .filter(([, v]) => v != null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

/**
 * Generic GET helper. Throws if myfxbook returns { error: true }.
 */
async function get(path, params = {}) {
  const url = `${BASE}/${path}.json?${qs(params)}`;
  const { data } = await axios.get(url, { timeout: 15000 });
  if (data.error) throw new Error(`MyFxBook error on ${path}: ${data.message}`);
  return data;
}

/**
 * Login and get a session token.
 * Store this in your DB (encrypted) — it expires after ~24 h of inactivity.
 */
async function login(email, password) {
  const data = await get("login", { email, password });
  return data.session; // string
}

/**
 * Logout / invalidate session.
 */
async function logout(session) {
  return get("logout", { session });
}

/**
 * Get all accounts owned by this session.
 * Returns the accounts array.
 */
async function getMyAccounts(session) {
  const data = await get("get-my-accounts", { session });
  return data.accounts; // array
}

/**
 * Get open trades for one account.
 */
async function getOpenTrades(session, id) {
  const data = await get("get-open-trades", { session, id });
  return data.openTrades; // array
}

/**
 * Get pending / open orders.
 */
async function getOpenOrders(session, id) {
  const data = await get("get-open-orders", { session, id });
  return data.openOrders; // array
}

/**
 * Get closed trade history.
 */
async function getHistory(session, id) {
  const data = await get("get-history", { session, id });
  return data.history; // array
}

/**
 * Get daily gain data between two dates.
 * start / end: "YYYY-MM-DD"
 * Returns a flat array (the API wraps each day in a nested array — we flatten).
 */
async function getDailyGain(session, id, start, end) {
  const data = await get("get-daily-gain", { session, id, start, end });
  // API returns [[{...}], [{...}]] — flatten one level
  return (data.dailyGain || []).flat();
}

/**
 * Get daily balance / pips / equity data.
 * Returns a flat array.
 */
async function getDataDaily(session, id, start, end) {
  const data = await get("get-data-daily", { session, id, start, end });
  return (data.dataDaily || []).flat();
}

module.exports = { 
    login, 
    logout,
    getMyAccounts, 
    getOpenTrades, 
    getOpenOrders, 
    getHistory, 
    getDailyGain, 
    getDataDaily 
};