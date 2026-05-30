const AccountWarning = require("../../../models/dashboard/accountWarning");
const TradingAccount = require("../../../models/dashboard/tradingAccount");

async function copyWarningsToReplacement(oldAccountId, newAccountId, opts = {}) {
  // Resolve both TradingAccounts (newest first, in case of historical dupes)
  const [oldTA, newTA] = await Promise.all([
    TradingAccount.findOne({ account: oldAccountId }, { _id: 1, userId: 1 })
      .sort({ createdAt: -1 })
      .lean(),
    TradingAccount.findOne({ account: newAccountId }, { _id: 1, userId: 1 })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  if (!oldTA) {
    console.warn(`[copyWarnings] no TradingAccount for old account ${oldAccountId}`);
    return { copied: 0 };
  }
  if (!newTA) {
    console.warn(`[copyWarnings] no TradingAccount for new account ${newAccountId}`);
    return { copied: 0 };
  }

  return copyWarningsByTradingAccount(oldTA._id, newTA._id, newTA.userId, opts);
}

/**
 * Lower-level copy when you already have both TradingAccount ids.
 */
async function copyWarningsByTradingAccount(oldTAId, newTAId, newUserId, opts = {}) {
  const { includeBreaches = false, resurface = false } = opts;

  const severityFilter = includeBreaches ? {} : { severity: { $ne: "breach" } };

  const warnings = await AccountWarning.find({
    tradingAccount: oldTAId,
    ...severityFilter,
  }).lean();

  if (!warnings.length) return { copied: 0 };

  const now = new Date();

  // Use upsert keyed on (tradingAccount, type, dedupKey) so this is idempotent
  // and respects the unique index on AccountWarning. Warnings without a
  // dedupKey get a stable synthetic one derived from their original _id, so
  // re-running won't duplicate them and they won't collide with cron keys.
  const ops = warnings.map((w) => {
    const { _id, createdAt, updatedAt, __v, ...rest } = w;
    const dedup = w.dedupKey ?? `CARRY:${_id}`;

    return {
      updateOne: {
        filter: { tradingAccount: newTAId, type: w.type, dedupKey: dedup },
        update: {
          $setOnInsert: {
            ...rest,
            dedupKey:       dedup,
            tradingAccount: newTAId,
            user:           newUserId ?? w.user,
            carriedFrom:    oldTAId, // optional schema field — see note
            ...(resurface && { acknowledged: false, resolvedAt: null }),
            snapshot: {
              ...(w.snapshot || {}),
              carriedFromTradingAccount: String(oldTAId),
              carriedFromWarning:        String(_id),
              carriedAt:                 now.toISOString(),
            },
          },
        },
        upsert: true,
      },
    };
  });

  const res = await AccountWarning.bulkWrite(ops, { ordered: false });
  const copied = res.upsertedCount ?? 0;
  console.log(
    `[copyWarnings] carried ${copied}/${warnings.length} warning(s) ` +
    `from TA ${oldTAId} -> ${newTAId}`
  );
  return { copied };
}

module.exports = {
  copyWarningsToReplacement,
  copyWarningsByTradingAccount,
};