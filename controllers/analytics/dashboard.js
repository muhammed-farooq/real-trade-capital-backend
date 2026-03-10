const dotenv = require("dotenv");
dotenv.config();

const axios = require("axios");
const TradingAccount = require("../../models/dashboard/tradingAcc");
const MyFxSession = require("../../models/dashboard/myfxSession");

const myFxbookEmail = process.env.MYFXBOOK_EMAIL;

const fetchMyFxBookAcc = async (login) => {
  try {
    const sessionDoc = await MyFxSession.findOne(
      { email: myFxbookEmail },
      { session: 1, _id: 0 }
    );

    if (!sessionDoc?.session) {
      console.log("[fetchMyFxBookAcc] session not found");
      return null;
    }

    const { data } = await axios.get(
      `https://www.myfxbook.com/api/get-my-accounts.json?session=${sessionDoc.session}`
    );

    if (data.error) {
      console.log("[fetchMyFxBookAcc] API error:", data.message || data.error);
      return null;
    }

    return data.accounts.find((a) => String(a.accountId) === String(login)) ?? null;
  } catch (err) {
    console.log("[fetchMyFxBookAcc] error:", err.message);
    return null;
  }
};

const syncMyfxbookData = async (tradingAccount, mfxAcc) => {
  try {
    tradingAccount.myfxbookId     = mfxAcc.id             ?? tradingAccount.myfxbookId;
    tradingAccount.name           = mfxAcc.name           ?? tradingAccount.name;
    tradingAccount.balance        = mfxAcc.balance        ?? 0;
    tradingAccount.equity         = mfxAcc.equity         ?? 0;
    tradingAccount.equityPercent  = mfxAcc.equityPercent  ?? 0;
    tradingAccount.profit         = mfxAcc.profit         ?? 0;
    tradingAccount.gain           = mfxAcc.gain           ?? 0;
    tradingAccount.absGain        = mfxAcc.absGain        ?? 0;
    tradingAccount.daily          = mfxAcc.daily          ?? 0;
    tradingAccount.monthly        = mfxAcc.monthly        ?? 0;
    tradingAccount.drawdown       = mfxAcc.drawdown       ?? 0;
    tradingAccount.deposits       = mfxAcc.deposits       ?? 0;
    tradingAccount.withdrawals    = mfxAcc.withdrawals    ?? 0;
    tradingAccount.interest       = mfxAcc.interest       ?? 0;
    tradingAccount.commission     = mfxAcc.commission     ?? 0;
    tradingAccount.currency       = mfxAcc.currency       ?? "USD";
    tradingAccount.profitFactor   = mfxAcc.profitFactor   ?? 0;
    tradingAccount.pips           = mfxAcc.pips           ?? 0;
    tradingAccount.demo           = mfxAcc.demo           ?? false;
    tradingAccount.server         = mfxAcc.server?.name   ?? tradingAccount.server;
    tradingAccount.lastUpdateDate = mfxAcc.lastUpdateDate ?? tradingAccount.lastUpdateDate;
    tradingAccount.creationDate   = mfxAcc.creationDate   ?? tradingAccount.creationDate;
    tradingAccount.firstTradeDate = mfxAcc.firstTradeDate ?? tradingAccount.firstTradeDate;

    // floatingPnl = equity - balance (open position PnL)
    tradingAccount.floatingPnl = (mfxAcc.equity ?? 0) - (mfxAcc.balance ?? 0);

    // dailyHighBalance — only update if today's balance is higher
    const today = new Date().toDateString();
    const lastDate = tradingAccount.dailyHighBalanceDate
      ? new Date(tradingAccount.dailyHighBalanceDate).toDateString()
      : null;

    if (lastDate !== today) {
      // New day — reset high to current balance
      tradingAccount.dailyHighBalance     = mfxAcc.balance ?? 0;
      tradingAccount.dailyHighBalanceDate = new Date();
    } else if ((mfxAcc.balance ?? 0) > (tradingAccount.dailyHighBalance ?? 0)) {
      tradingAccount.dailyHighBalance = mfxAcc.balance;
    }

    tradingAccount.status    = "active";
    tradingAccount.syncError = undefined;
    tradingAccount.lastSync  = new Date();

    await tradingAccount.save();
  } catch (err) {
    console.error("[syncMyfxbookData] save error:", err.message);
    tradingAccount.status    = "failed";
    tradingAccount.syncError = err.message;
    await tradingAccount.save().catch(() => {});
  }
};

const fetchTradingAcc = async (req, res) => {
  try {
    const { id } = req.params;

    const tradingAccount = await TradingAccount.findOne({ account: id });
    if (!tradingAccount) {
      return res.status(404).json({ success: false, message: "Trading account not found" });
    }

    if (!tradingAccount.login) {
      return res.status(200).json({
        success: true,
        data: tradingAccount,
        synced: false,
      });
    }

    const mfxAcc = await fetchMyFxBookAcc(tradingAccount.login);

    if (mfxAcc) {
      await syncMyfxbookData(tradingAccount, mfxAcc);
    } else {
      tradingAccount.lastSync = new Date();
      await tradingAccount.save().catch(() => {});
    }

    return res.status(200).json({
      success: true,
      data: tradingAccount,       
      synced: !!mfxAcc,
    });
  } catch (error) {
    console.error("[fetchTradingAcc] error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { fetchTradingAcc };