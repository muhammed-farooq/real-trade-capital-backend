const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
    {
        providerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        userId: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        latestMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "messages"
        },
    },
    { timestamps: true }
);

const chatModal = mongoose.model("chats",chatSchema);

module.exports = chatModal;