// models.mjs

import mongoose from 'mongoose';

// MongoDB connection URL
const mongoUrl = process.env.CHAT_APP_DATABASE_URL;

// Mongoose schemas
const conversationSchema = new mongoose.Schema({
    name: String,
});

const messageSchema = new mongoose.Schema({
    conversationId: String,
    text: String,
    createdAt: { type: Date, default: Date.now },
});

// Mongoose models
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

// Connect to MongoDB
export const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(mongoUrl);
    }
};

// Export models
export { Conversation, Message };
