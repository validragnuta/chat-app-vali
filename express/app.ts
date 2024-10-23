import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { OpenAI } from 'openai';
import { Request, Response } from 'express';
import { connectToDatabase, Conversation, Message, mockConversations, mockMessages } from "./models";

// Load environment variables from .env file
dotenv.config();

// Express App Setup
const app = express();

// Middlewares for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// GET / - Hello world endpoint
app.get("/", (_req: Request, res: Response): void => {
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
app.get('/conversations/:conversationId', async (req: Request, res:Response) => {
  const { conversationId } = req.params;

  if (!conversationId) {
    res.json({ message: "Missing conversationId" });
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
app.post('/conversations/:conversationId/messages', async (req: Request, res:Response) => {
  const message = req.body.message;
  const { conversationId } = req.params;

  if (!conversationId || !message) {
    res.json({ message: "Missing conversationId or message" });
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

// DELETE /conversations/:conversationId - Delete a conversation and its messages
// TODO Implement the logic for this endpoint
app.delete('/conversations/:conversationId', async (req: Request, res:Response) => {
  res.json({ message: "not implemented" });
});

// Start the Express server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

