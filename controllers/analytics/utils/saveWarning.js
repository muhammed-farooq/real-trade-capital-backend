// jobs/utils/saveWarning.js
const AccountWarning = require("../../../models/dashboard/accountWarning");
const TradingAccount = require("../../../models/dashboard/tradingAccount");

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

// How many "warning"-severity hits of the same TYPE before auto-escalating to breach
const ESCALATION_THRESHOLD = 3;

// These types are always an immediate breach — no escalation counter
const DIRECT_BREACH_TYPES = new Set([
  "DAILY_DRAWDOWN",
  "MAX_DRAWDOWN",
  "BALANCE_BREACH",
]);

// ─────────────────────────────────────────────────────────────────────────────
// failAccount
//   Sets status → "failed" (valid enum value in TradingAccountSchema).
//   Stores the breach reason in syncError (existing String field on schema).
// ─────────────────────────────────────────────────────────────────────────────
const failAccount = async (tradingAccountId, reason) => {
  try {
    await TradingAccount.updateOne(
      { _id: tradingAccountId },
      {
        $set: {
          status:    "failed",  // enum: ["active", "failed", "pending", "completed"]
          syncError: reason,    // repurpose existing String field as breach reason
          lastSync:  new Date(),
        },
      }
    );
    console.warn(`[failAccount] Account ${tradingAccountId} → failed. Reason: ${reason}`);
  } catch (err) {
    console.error(`[failAccount] Could not update account ${tradingAccountId}:`, err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// saveWarning
//   1. Guard — skip if account is already failed or completed
//   2. Upsert the warning (deduped by tradingAccount+type+dedupKey)
//   3. Direct breach types → fail account immediately
//   4. Warning types → count; at ESCALATION_THRESHOLD escalate to breach + fail
// ─────────────────────────────────────────────────────────────────────────────
const saveWarning = async (opts) => {
  try {
    // ── 0. Skip if account is already out of play ────────────────────────────
    const account = await TradingAccount.findById(opts.tradingAccount, { status: 1 }).lean();

    if (!account) return;

    // "failed"    = breached / not passed
    // "completed" = challenge cycle done (passed or failed and closed)
    // Either way, no further processing needed.
    if (account.status === "failed" || account.status === "completed" || account.status === "Not passed") return;

    // ── 1. Upsert — $setOnInsert ensures the 10-min cron never duplicates ────
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

    // Nothing new inserted → this exact event was already recorded, stop here
    if (result.upsertedCount === 0) return;

    console.log(
      `[saveWarning] +1 ${opts.severity} | type=${opts.type} | account=${opts.tradingAccount} | key=${opts.dedupKey}`
    );

    // ── 2. Direct breach → fail immediately ─────────────────────────────────
    if (DIRECT_BREACH_TYPES.has(opts.type) || opts.severity === "breach") {
      // Ensure the stored severity says "breach" (caller may have passed "warning" by mistake)
      await AccountWarning.updateOne(
        { tradingAccount: opts.tradingAccount, type: opts.type, dedupKey: opts.dedupKey },
        { $set: { severity: "breach" } }
      );

      await failAccount(opts.tradingAccount, `${opts.type}: ${opts.title}`);
      return;
    }

    // ── 3. Escalation — count all unresolved warnings of this type ───────────
    const warningCount = await AccountWarning.countDocuments({
      tradingAccount: opts.tradingAccount,
      type:           opts.type,
      severity:       "warning",
      resolvedAt:     null,
    });

    if (warningCount >= ESCALATION_THRESHOLD) {
      // Upgrade all existing warnings of this type to "breach"
      await AccountWarning.updateMany(
        { tradingAccount: opts.tradingAccount, type: opts.type, severity: "warning" },
        { $set: { severity: "breach" } }
      );

      await failAccount(
        opts.tradingAccount,
        `${opts.type} escalated to breach after ${warningCount} violations: ${opts.title}`
      );
    }

  } catch (err) {
    if (err.code === 11000) return; // race-condition duplicate key — safe to ignore
    console.error("[saveWarning] unexpected error:", err.message);
  }
};

module.exports = { saveWarning, failAccount };