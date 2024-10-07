// handlers.mjs

import { connectToDatabase, Conversation, Message } from './models.mjs';

// Mock data
const mockConversations = [
    { id: "1", name: "Conversation 1" },
    { id: "2", name: "Conversation 2" },
];

const mockMessages = [
    { id: "1", text: "Hello from Conversation 1!", agent:"ai", conversationId: "1" },
    { id: "2", text: "Hi there, how are you?", agent:"human", conversationId: "1" },
    { id: "3", text: "Hello from Conversation 2!", agent:"ai", conversationId: "2" },
];

// GET /conversations
export const get_all_conversations_handler = async (event) => {
    console.log("Fetching all conversations");

    let conversations;
    try {
        // Check if the database URL is provided
        if (process.env.CHAT_APP_DATABASE_URL) {
            await connectToDatabase();
            conversations = await Conversation.find(); // Fetch all conversations
        } else {
            console.warn("No database URL provided, returning mock data.");
            conversations = mockConversations; // Use mock data if no DB URL is present
        }
    } catch (error) {
        console.warn("Could not connect to the database, returning mock data.", error);
        conversations = mockConversations; // Use mock data if DB connection fails
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ conversations }),
    };
};

// GET /conversations/{conversationId}
export const get_conversation_handler = async (event) => {
    console.log("Fetching messages from conversation");

    if (!event.rawPath) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing path parameters" }),
        };
    }

    const path = event.rawPath; // e.g., '/conversations/1'
    const conversationId = path.split('/')[2];
    if (!conversationId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing conversationId" }),
        };
    }

    let messages;

    try {
        if(process.env.CHAT_APP_DATABASE_URL)   {
            await connectToDatabase();
            messages = await Message.find({ conversationId }); // Fetch messages for the conversation
        } else {
            console.warn("Could not connect to the database, returning mock data.", error);
            // Use mock data if DB is unavailable
            messages = mockMessages.filter(msg => msg.conversationId === conversationId);
        }
    } catch (error) {
        console.warn("Could not connect to the database, returning mock data.", error);
        // Use mock data if DB is unavailable
        messages = mockMessages.filter(msg => msg.conversationId === conversationId);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ messages }),
    };
};

// PUT /conversations/{conversationId}/messages
export const put_message_handler = async (event) => {
    console.log("Adding message to conversation");

    if (!event.rawPath) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing path parameters" }),
        };
    }

    const path = event.rawPath; // e.g., '/conversations/1/messages'
    const conversationId = path.split('/')[2];
    if (!conversationId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing conversationId" }),
        };
    }

    const body = JSON.parse(event.body);
    if (!body.message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing message" }),
        };
    }
    const newMessageText = body.message;

    try {
        if(process.env.CHAT_APP_DATABASE_URL)   {
            await connectToDatabase();
            const message = new Message({
                conversationId,
                text: newMessageText,
            });
            await message.save(); // Save the new message
        } else {
            console.warn("Could not connect to the database, using mock data.", error);
            console.log("Mock: Message added", newMessageText); // Log mock message addition
        }
    } catch (error) {
        console.warn("Could not connect to the database, using mock data.", error);
        console.log("Mock: Message added", newMessageText); // Log mock message addition
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Message added successfully" }),
    };
};
