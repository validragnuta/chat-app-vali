import express from 'express';
import serverless from 'serverless-http';
import cors from "cors";
import { connectToDatabase, Conversation, Message } from './models.mjs'; // Import models

const app = express();
app.use(express.json());
app.use(cors());

// Mock data
const mockConversations = [
    { id: 1, name: "conv-123456" },
    { id: 2, name: "conv-567890" },
];

const mockMessages = (conversationId) => [
    { id: 1, text: "Hello!", conversation_id: conversationId },
    { id: 2, text: "How's it going?", conversation_id: conversationId },
];

// Health check route
app.get('/', (req, res) => {
    return res.status(200).json({ message: "Hello from the backend!" });
});

// Route to fetch all conversations
app.get('/conversations', async (req, res) => {
    console.log("Fetching all conversations");

    let conversations;

    try {
        if (process.env.CHAT_APP_DATABASE_URL) {
            await connectToDatabase();
            conversations = await Conversation.find(); // Fetch all conversations from MongoDB
        } else {
            console.warn("No database URL provided, returning mock data.");
            conversations = mockConversations; // Use mock data if no DB URL is present
        }
    } catch (error) {
        console.warn("Could not connect to the database, returning mock data.", error);
        conversations = mockConversations; // Use mock data if DB connection fails
    }

    return res.status(200).json({ conversations });
});

// Route to fetch all messages from a specific conversation
app.get('/conversations/:conversationId/messages', async (req, res) => {
    console.log("Fetching messages from conversation");

    const conversationId = req.params.conversationId;
    let messages;

    try {
        if (process.env.CHAT_APP_DATABASE_URL) {
            await connectToDatabase();
            messages = await Message.find({ conversation_id: conversationId }); // Fetch messages from MongoDB
        } else {
            console.warn("No database URL provided, returning mock data.");
            messages = mockMessages(conversationId); // Use mock data if no DB URL is present
        }
    } catch (error) {
        console.warn("Could not connect to the database, returning mock data.", error);
        messages = mockMessages(conversationId); // Use mock data if DB connection fails
    }

    return res.status(200).json({ messages });
});

// Route to add a message to a specific conversation
app.post('/conversations/:conversationId/messages', async (req, res) => {
    console.log("Adding message to conversation");

    const conversationId = req.params.conversationId;
    const { message } = req.body;

    try {
        if (process.env.CHAT_APP_DATABASE_URL) {
            await connectToDatabase();
            const newMessage = new Message({ text: message, conversation_id: conversationId });
            await newMessage.save(); // Save the message to MongoDB
        } else {
            console.log("Mock: Message added", message);
        }
    } catch (error) {
        console.error("Database error:", error);
        return res.status(500).json({ message: "Error adding message" });
    }

    return res.status(200).json({ message: "Message added successfully" });
});

// Export the app wrapped with serverless-http to handle the Lambda function
export const handler = serverless(app);
