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
exports.handler = void 0;
const express_1 = __importDefault(require("express"));
const serverless_http_1 = __importDefault(require("serverless-http"));
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
    }
    catch (error) {
        console.error("Error saving message", error);
        res.json({ message: "Message dropped", answer: "Internal Server Error" });
        return;
    }
    if (process.env.OPENAI_API_KEY) {
        try {
            // Initialize OpenAI API
            const openai = new openai_1.OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });
            const completion = yield openai.chat.completions.create({
                model: 'gpt-4',
                messages: [{ role: 'user', content: message }],
            });
            res.json({ message: "Message added successfully", answer: completion.choices[0].message.content });
        }
        catch (error) {
            console.error("Error calling the AI", error);
            res.json({ message: "Message added successfully", answer: "Failed to communicate with the AI" });
        }
        try {
            const aiMessage = new models_1.Message({
                conversationId: conversationId,
                text: answer,
                author: "ai",
            });
            yield aiMessage.save();
        }
        catch (error) {
            console.error("Error saving AI message", error);
        }
    }
    else {
        console.warn("No process.env.OPENAI_API_KEY provided, using mock data.");
        res.json({ message: "Message added successfully", answer: "This is a mock response" });
    }
}));
// DELETE /conversations/:conversationId - Delete a conversation and its messages
// TODO Implement the logic for this endpoint
app.delete('/conversations/:conversationId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ message: "not implemented" });
}));
// Start the Express server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
// You don't need to listen to the port when using serverless functions in production
if (process.env.NODE_ENV === "dev") {
    app.listen(3000, () => {
        console.log("Server is running on port 3000. Check the app on http://localhost:8080");
    });
}
exports.handler = (0, serverless_http_1.default)(app);
