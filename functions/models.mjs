import mongoose from 'mongoose';

// Mongoose schemas
const conversationSchema = new mongoose.Schema({
    name: String,
});

const messageSchema = new mongoose.Schema({
    conversationId: String,
    agent: String, // ai or human
    text: String,
    createdAt: { type: Date, default: Date.now },
});

// Mongoose models
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);

// Connect to MongoDB
export const connectToDatabase = async () => {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(process.env.CHAT_APP_DATABASE_URL);
    }
};

// Export models
export { Conversation, Message };
