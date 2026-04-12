// services/createTradingAccount.js
const TradingAccount = require("../models/dashboard/tradingAccount");
const Package        = require("../models/package");

const toNum = (v, fallback = 0) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? fallback : n;
};

const LOT_SIZE_MAP = [
  { threshold: 500000, lots: 25.0 },
  { threshold: 100000, lots: 10.0 },
  { threshold:  50000, lots:  5.0 },
  { threshold:  25000, lots:  2.5 },
  { threshold:  10000, lots:  1.0 },
];

const getLotSizeByAccountSize = (accountSize) => {
  const match = LOT_SIZE_MAP.find(({ threshold }) => accountSize >= threshold);
  return match ? match.lots : 5; // fallback to 1.0
};

const buildChallengeConfig = (packageData, phase = "PhaseOne", accountSize = 0) => {
  const cfg =
    phase === "Funded"
      ? packageData.fundedStage
      : packageData.evaluationStage?.[phase];

  if (!cfg) throw new Error(`Phase "${phase}" not found on package`);

  // Package-level maxLotSize (0 = unlimited, e.g. evaluation stages)
  const packageLotSize = toNum(cfg.MaxLotSize, 0);

  // Only apply account-size-based limits when the package has a non-zero cap
  const maxLotSize =
    packageLotSize === 0 ? 0 : getLotSizeByAccountSize(accountSize);

  return {
    maxDailyLoss:   toNum(cfg.MaximumDailyLoss,   5),
    maxTotalLoss:   toNum(cfg.MaximumLoss,        10),
    profitTarget:   toNum(cfg.ProfitTarget,       10),
    minTradingDays: toNum(cfg.MinimumTradingDays, 10),
    maxLotSize,
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

  const challengeConfig = buildChallengeConfig(packageData, phase, accountSize);

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