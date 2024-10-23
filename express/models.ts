import mongoose from 'mongoose';

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

// Helper function to connect to the mongo database
const connectToDatabase = async () => {
  if (!process.env['CHAT_APP_DATABASE_URL']) {
    throw new Error('No database URL provided');
  }
  await mongoose.connect(process.env['CHAT_APP_DATABASE_URL']);
};

// Mock data
const mockConversations = [
  { id: '1', name: 'Conversation 1' },
  { id: '2', name: 'Conversation 2' },
];

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

export { Conversation, Message, connectToDatabase, mockConversations, mockMessages };
