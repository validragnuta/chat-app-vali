"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const openai_1 = require("openai");
const models_1 = require("./models");
// Load environment variables from .env file
dotenv_1.default.config();
// Express App Setup
const app = (0, express_1.default)();
// Middlewares for CORS and JSON parsing
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// GET / - Hello world endpoint
app.get("/", (_req, res) => {
    res.send("Hello World from Express serverless!");
});
// GET /conversations - Fetch all conversations from the database
app.get('/conversations', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let conversations;
    try {
        if (process.env["CHAT_APP_DATABASE_URL"]) {
            yield (0, models_1.connectToDatabase)();
            conversations = yield models_1.Conversation.find();
            const messages = yield models_1.Message.find();
            conversations = conversations.map(conversation => {
                const conversationMessages = messages.filter(message => message.conversationId === conversation.conversationId);
                return Object.assign(Object.assign({}, conversation.toObject()), { messages: conversationMessages });
            });
            console.log("Connected to the database and fetched conversations.");
        }
        else {
            console.warn("No database URL provided, returning mock data.");
            conversations = models_1.mockConversations;
        }
    }
    catch (error) {
        console.warn("Could not connect to the database, returning mock data.", error);
        conversations = models_1.mockConversations;
    }
    res.json({ conversations });
}));
// GET /conversations/:conversationId - Fetch messages from a specific conversation
app.get('/conversations/:conversationId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    if (!conversationId) {
        res.json({ message: "Missing conversationId" });
    }
    let messages;
    try {
        if (process.env["CHAT_APP_DATABASE_URL"]) {
            yield (0, models_1.connectToDatabase)();
            messages = yield models_1.Message.find({ conversationId }); // Fetch messages for the conversation
        }
        else {
            console.warn("Could not connect to the database, returning mock data.");
            messages = models_1.mockMessages.filter(msg => msg.conversationId === conversationId);
        }
    }
    catch (error) {
        console.warn("Could not connect to the database, returning mock data.", error);
        messages = models_1.mockMessages.filter(msg => msg.conversationId === conversationId);
    }
    res.json({ messages });
}));
// POST /conversations/:conversationId/messages - Add a pair of messages (human and AI)
app.post('/conversations/:conversationId/messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const message = req.body.message;
    const { conversationId } = req.params;
    if (!conversationId || !message) {
        res.json({ message: "Missing conversationId or message" });
    }
    let answer;
    try {
        if (process.env["CHAT_APP_DATABASE_URL"]) {
            yield (0, models_1.connectToDatabase)();
            let conversation = yield models_1.Conversation.findOne({ conversationId });
            if (!conversation) {
                conversation = new models_1.Conversation({
                    conversationId: conversationId,
                    name: `Conversation ${conversationId}`,
                });
                yield conversation.save();
            }
            const newMessage = new models_1.Message({
                conversationId: conversationId,
                text: message,
                author: "human",
            });
            yield newMessage.save();
            // Initialize OpenAI API
            const openai = new openai_1.OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            if (openai) {
                const completion = yield openai.chat.completions.create({
                    model: 'gpt-4',
                    messages: [{ role: 'user', content: message }],
                });
                answer = completion.choices[0].message.content;
                const aiMessage = new models_1.Message({
                    conversationId: conversationId,
                    text: answer,
                    author: "ai",
                });
                yield aiMessage.save();
            }
        }
        else {
            console.warn("No database URL provided, using mock data.");
            answer = "This is a mock response"; // Mock AI response
        }
        res.json({ message: "Message added successfully", answer });
    }
    catch (error) {
        console.warn("Could not connect to the database, using mock data.", error);
        res.json({ message: "Message added successfully" });
    }
}));
// DELETE /conversations/:conversationId - Delete a conversation and its messages
// TODO Implement the logic for this endpoint
// DELETE /conversations/:conversationId - Delete a conversation and its messages
app.delete('/conversations/:conversationId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ message: "not implemented" });
}));
// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
