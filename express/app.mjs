import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import cors from 'cors';
import { OpenAI } from 'openai';

// Load environment variables from .env file
dotenv.config();

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

// Mock data
const mockConversations = [
  { id: "1", name: "Conversation 1" },
  { id: "2", name: "Conversation 2" },
];

const mockMessages = [
  { id: "1", text: "Hello from Conversation 1!", agent: "ai", conversationId: "1" },
  { id: "2", text: "Hi there, how are you?", agent: "human", conversationId: "1" },
  { id: "3", text: "Hello from Conversation 2!", agent: "ai", conversationId: "2" },
];

// Express App Setup
const app = express();

// Middlewares for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// GET / - Hello world endpoint
app.get("/", (_req, res) => {
  res.send("Hello World from Express serverless!");
});

// GET /conversations - Fetch all conversations from the database
app.get('/conversations', async (req, res) => {
  let conversations;

  try {
    if (process.env["CHAT_APP_DATABASE_URL"]) {
      await connectToDatabase();
      conversations = await Conversation.find()
      const messages = await Message.find();

      conversations = conversations.map(conversation => {
        const conversationMessages = messages.filter(
          message => message.conversationId === conversation.conversationId
        );
        return { ...conversation.toObject(), messages: conversationMessages };
      });
      console.log("Connected to the database and fetched conversations.");
    } else {
      console.warn("No database URL provided, returning mock data.");
      conversations = mockConversations;
    }
  } catch (error) {
    console.warn("Could not connect to the database, returning mock data.", error);
    conversations = mockConversations;
  }

  res.json({ conversations });
});

// GET /conversations/:conversationId - Fetch messages from a specific conversation
app.get('/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    return res.json({ message: "Missing conversationId" });
  }

  let messages;
  try {
    if (process.env["CHAT_APP_DATABASE_URL"]) {
      await connectToDatabase();
      messages = await Message.find({ conversationId }); // Fetch messages for the conversation
    } else {
      console.warn("Could not connect to the database, returning mock data.");
      messages = mockMessages.filter(msg => msg.conversationId === conversationId);
    }
  } catch (error) {
    console.warn("Could not connect to the database, returning mock data.", error);
    messages = mockMessages.filter(msg => msg.conversationId === conversationId);
  }

  res.json({ messages });
});


// POST /conversations/:conversationId/messages - Add a pair of messages (human and AI)
app.post('/conversations/:conversationId/messages', async (req, res) => {
  const message = req.body.message;
  const { conversationId } = req.params;

  if (!conversationId || !message) {
    return res.json({ message: "Missing conversationId or message" });
  }

  let answer;
  try {
    if (process.env["CHAT_APP_DATABASE_URL"]) {
      await connectToDatabase();
      let conversation = await Conversation.findOne({ conversationId });

      if (!conversation) {
        conversation = new Conversation({
          conversationId: conversationId,
          name: `Conversation ${conversationId}`,
        });
        await conversation.save();
      }

      const newMessage = new Message({
        conversationId: conversationId,
        text: message,
        author: "human",
      });
      await newMessage.save();

      // Initialize OpenAI API
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      if (openai) {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ role: 'user', content: message }],
        });
        answer = completion.choices[0].message.content;

        const aiMessage = new Message({
          conversationId: conversationId,
          text: answer,
          author: "ai",
        });
        await aiMessage.save();
      }
    } else {
      console.warn("No database URL provided, using mock data.");
      answer = "This is a mock response"; // Mock AI response
    }

    res.json({ message: "Message added successfully", answer });
  } catch (error) {
    console.warn("Could not connect to the database, using mock data.", error);
    res.json({ message: "Message added successfully" });
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Helper function to connect to the mongo database
const connectToDatabase = async () => {
  await mongoose.connect(process.env["CHAT_APP_DATABASE_URL"]);
};
