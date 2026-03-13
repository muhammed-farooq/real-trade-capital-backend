// jobs/utils/saveWarning.js
const AccountWarning = require("../../models/dashboard/accountWarning");

const saveWarning = async (opts) => {
  try {
    await AccountWarning.updateOne(
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
        },
      },
      { upsert: true }
    );
  } catch (err) {
    // Duplicate key on unique index → already saved, ignore
    if (err.code === 11000) return;
    console.error("[saveWarning] unexpected error:", err.message);
  }
};

module.exports = { saveWarning };