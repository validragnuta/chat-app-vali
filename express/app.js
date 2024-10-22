import express from "express";

// const app = express();
// const port = 3000;

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

app.get("/", (_req, res) => {
  res.send("Hello World from Express serverless!");
});



// GET /conversations - Fetch all conversations
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
    } else {
      console.warn("No database URL provided, returning mock data.");
      conversations = mockConversations;
    }
  } catch (error) {
    console.warn("Could not connect to the database, returning mock data.", error);
    conversations = mockConversations;
  }

  res.status(200).json({ conversations });
});

// Start the Express server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
