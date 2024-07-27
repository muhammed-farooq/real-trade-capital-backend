const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
  senderType: {
    type: String,
      enum: ["users", "provider"],
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "messages.senderType", // Corrected 'message' to 'messages'
  },
  content: { 
    type: String, 
    trim: true
  },
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "chats" 
  },
  isRead: { 
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  }
  },
  { timestamps: true }
);

const Message = mongoose.model("messages", messageSchema);
module.exports = Message;