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
exports.mockMessages = exports.mockConversations = exports.connectToDatabase = exports.Message = exports.Conversation = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Mongoose schemas
const conversationSchema = new mongoose_1.default.Schema({
    conversationId: {
        type: String,
        required: true,
        unique: true,
    },
    createdAt: { type: Date, default: Date.now },
});
const messageSchema = new mongoose_1.default.Schema({
    conversationId: String,
    text: String,
    author: String,
    createdAt: { type: Date, default: Date.now },
});
// Mongoose models
const Conversation = mongoose_1.default.model('Conversation', conversationSchema);
exports.Conversation = Conversation;
const Message = mongoose_1.default.model('Message', messageSchema);
exports.Message = Message;
// Helper function to connect to the mongo database
const connectToDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!process.env['CHAT_APP_DATABASE_URL']) {
        throw new Error('No database URL provided');
    }
    yield mongoose_1.default.connect(process.env['CHAT_APP_DATABASE_URL']);
});
exports.connectToDatabase = connectToDatabase;
// Mock data
const mockConversations = [
    { id: '1', name: 'Conversation 1' },
    { id: '2', name: 'Conversation 2' },
];
exports.mockConversations = mockConversations;
const mockMessages = [
    {
        id: '1',
        text: 'Hello from Conversation 1!',
        agent: 'ai',
        conversationId: '1',
    },
    {
        id: '2',
        text: 'Hi there, how are you?',
        agent: 'human',
        conversationId: '1',
    },
    {
        id: '3',
        text: 'Hello from Conversation 2!',
        agent: 'ai',
        conversationId: '2',
    },
];
exports.mockMessages = mockMessages;
