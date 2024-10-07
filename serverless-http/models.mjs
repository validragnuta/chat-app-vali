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

// Connect to MongoDB
export const connectToDatabase = async () => {
    const dbUrl = process.env.CHAT_APP_DATABASE_URL;
    if (!dbUrl) {
        throw new Error("No database URL provided");
    }
    await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
};

export const Conversation = mongoose.model('Conversation', conversationSchema);

export const Message = mongoose.model('Message', messageSchema);
