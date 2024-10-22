import mongoose from 'mongoose';

// Mongoose schemas
const conversationSchema = new mongoose.Schema({
  conversationId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  conversationId: String,
  text: String,
  author: String,
  createdAt: { type: Date, default: Date.now },
});

// Mongoose models
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

// Export models
module.exports = { Conversation, Message };
