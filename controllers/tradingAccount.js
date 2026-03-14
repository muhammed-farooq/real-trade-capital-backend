// services/createTradingAccount.js
const TradingAccount = require("../models/dashboard/tradingAccount");
const Package        = require("../models/package");

const toNum = (v, fallback = 0) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? fallback : n;
};

const buildChallengeConfig = (packageData, phase = "PhaseOne") => {
  const cfg =
    phase === "Funded"
      ? packageData.fundedStage
      : packageData.evaluationStage?.[phase];

  if (!cfg) throw new Error(`Phase "${phase}" not found on package`);

  return {
    maxDailyLoss:   toNum(cfg.MaximumDailyLoss,   5),
    maxTotalLoss:   toNum(cfg.MaximumLoss,        10),
    profitTarget:   toNum(cfg.ProfitTarget,       10),
    minTradingDays: toNum(cfg.MinimumTradingDays, 10),
    maxLotSize:     toNum(cfg.MaxLotSize,          0),  // 0 = unlimited
  };
};

const createTradingAccount = async ({
  userId,
  orderId,
  accountId,
  packageId,
  accountSize,
  login,
  phase = "PhaseOne",
}) => {
  if (!userId || !orderId || !accountId || !packageId || !accountSize) {
    throw new Error(
      "createTradingAccount: userId, orderId, accountId, packageId and accountSize are required"
    );
  }

  const packageData = await Package.findById(packageId).lean();
  if (!packageData) throw new Error(`Package ${packageId} not found`);

  const challengeConfig = buildChallengeConfig(packageData, phase);

  const payload = {
    userId,
    order:           orderId,
    account:         accountId,
    startingBalance: Number(accountSize),
    challengeConfig,
    status:          login ? "active" : "pending",
    ...(login && { login }),
  };

  // Upsert: one TradingAccount per (userId + order + account)
  const tradingAccount = await TradingAccount.findOneAndUpdate(
    { userId, order: orderId, account: accountId },
    { $set: payload },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  return tradingAccount;
};

module.exports = { createTradingAccount, buildChallengeConfig };