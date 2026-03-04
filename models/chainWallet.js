const mongoose = require("mongoose");

//Backup of pvtKey, not in use, just for reference

const chainWallet = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "users",
    }, 
    address: {
      type: String,
      required: true,
      trim: true,
      sparse: true
    },
    privatetKey: {
      type: String,
      required: true,
      trim: true,
      sparse: true
    },
    chain : {
      type: String,
      enum: ["BSC", "TRON", "ETHEREUM"],
      required: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

chainWallet.index({ userId: 1, address: 1 , createdAt: -1 });
chainWallet.index({ chain: 1, isUsed: 1 , userId: -1 });
chainWallet.index({ address: 1 });

const onChainWallet = mongoose.model("chainWallet", chainWallet);
module.exports = onChainWallet;
