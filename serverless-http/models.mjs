import mongoose from 'mongoose';

// Connect to MongoDB
export const connectToDatabase = async () => {
    const dbUrl = process.env.CHAT_APP_DATABASE_URL;
    if (!dbUrl) {
        throw new Error("No database URL provided");
    }
    await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
};

// Define Conversation schema and model
const conversationSchema = new mongoose.Schema({
    name: { type: String, required: true }
});

export const Conversation = mongoose.model('Conversation', conversationSchema);

// Define Message schema and model
const messageSchema = new mongoose.Schema({
    text: { type: String, required: true },
    conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation' }
});

export const Message = mongoose.model('Message', messageSchema);
