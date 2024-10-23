import express from "express";
import Serverless from "serverless-http";
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
    console.error("Missing conversationId or message");
    res.json({ message: "Missing conversationId or message", answer: "Internal Server Error" });
    return;
  }

  if (!process.env["CHAT_APP_DATABASE_URL"]) {
    console.error("Missing process.env.CHAT_APP_DATABASE_URL:");
    res.json({ message: "Message dropped", answer: "Database not defined" });
    return;
  }

  let answer;
  try {
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
  } catch (error) {
    console.error("Error saving message", error);
    res.json({ message: "Message dropped", answer: "Internal Server Error" });
    return;
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      // Initialize OpenAI API
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: message }],
      });
      res.json({message: "Message added successfully", answer: completion.choices[0].message.content});
    } catch(error) {
      console.error("Error calling the AI", error);
      res.json({ message: "Message added successfully", answer: "Failed to communicate with the AI" });
    }

    try {
      const aiMessage = new Message({
        conversationId: conversationId,
        text: answer,
        author: "ai",
      });
      await aiMessage.save();
    } catch(error) {
      console.error("Error saving AI message", error);
    }
  } else {
    console.warn("No process.env.OPENAI_API_KEY provided, using mock data.");
    res.json({message: "Message added successfully", answer: "This is a mock response"});
  }
});

// DELETE /conversations/:conversationId - Delete a conversation and its messages
// TODO Implement the logic for this endpoint
app.delete('/conversations/:conversationId', async (req: Request, res:Response) => {
  res.json({ message: "not implemented" });
});

// Start the Express server
// const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// You don't need to listen to the port when using serverless functions in production
if (process.env.NODE_ENV === "dev") {
  app.listen(3000, () => {
    console.log(
      "Server is running on port 3000. Check the app on http://localhost:8080"
    );
  });
}

export const handler = Serverless(app);
