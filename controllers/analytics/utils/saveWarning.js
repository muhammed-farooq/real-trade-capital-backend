// jobs/utils/saveWarning.js
const AccountWarning             = require("../../models/dashboard/accountWarning");
const TradingAccount             = require("../../models/dashboard/tradingAccount");
const { breachAccount }          = require("./accountlifecycle");

const ESCALATION_THRESHOLD = 3;

const DIRECT_BREACH_TYPES = new Set([
  "DAILY_DRAWDOWN",
  "MAX_DRAWDOWN",
  "BALANCE_BREACH",
]);

const saveWarning = async (opts) => {
  try {
    // 0. Skip if account is already out of play
    const acc = await TradingAccount.findById(opts.tradingAccount, { status: 1 }).lean();
    if (!acc) return;
    if (acc.status === "failed" || acc.status === "completed") return;

    // 1. Upsert — deduped by (tradingAccount + type + dedupKey)
    const result = await AccountWarning.updateOne(
      {
        tradingAccount: opts.tradingAccount,
        type:           opts.type,
        dedupKey:       opts.dedupKey,
      },
      {
        $setOnInsert: {
          tradingAccount: opts.tradingAccount,
          user:           opts.user,
          type:           opts.type,
          severity:       opts.severity,
          title:          opts.title,
          message:        opts.message,
          snapshot:       opts.snapshot ?? {},
          dedupKey:       opts.dedupKey,
          acknowledged:   false,
          resolvedAt:     null,
          createdAt:      new Date(),
        },
      },
      { upsert: true }
    );

    if (result.upsertedCount === 0) return; // already recorded

    console.log(`[saveWarning] +1 ${opts.severity} | type=${opts.type} | account=${opts.tradingAccount} | key=${opts.dedupKey}`);

    // 2. Direct breach types → breach account immediately
    if (DIRECT_BREACH_TYPES.has(opts.type) || opts.severity === "breach") {
      await AccountWarning.updateOne(
        { tradingAccount: opts.tradingAccount, type: opts.type, dedupKey: opts.dedupKey },
        { $set: { severity: "breach" } }
      );
      await breachAccount(opts.tradingAccount, `${opts.type}: ${opts.title}`);
      return;
    }

    // 3. Warning types — count; at ESCALATION_THRESHOLD escalate + breach
    const warningCount = await AccountWarning.countDocuments({
      tradingAccount: opts.tradingAccount,
      type:           opts.type,
      severity:       "warning",
      resolvedAt:     null,
    });

    if (warningCount >= ESCALATION_THRESHOLD) {
      await AccountWarning.updateMany(
        { tradingAccount: opts.tradingAccount, type: opts.type, severity: "warning" },
        { $set: { severity: "breach" } }
      );
      await breachAccount(
        opts.tradingAccount,
        `${opts.type} escalated to breach after ${warningCount} violations: ${opts.title}`
      );
    }

  } catch (err) {
    if (err.code === 11000) return;
    console.error("[saveWarning] unexpected error:", err.message);
  }
};

module.exports = { saveWarning };