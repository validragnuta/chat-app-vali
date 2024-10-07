import OpenAI from "openai";
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
    if (event.httpMethod === 'OPTIONS') {
        console.log("CORS preflight request success");
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",  // Allow all origins
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",  // Allow methods
                "Access-Control-Allow-Headers": "Content-Type",  // Allow headers
            },
            body: JSON.stringify({ message: "CORS preflight request success" }),
        };
    }

    console.log("Fetching all conversations");

    let conversations;
    try {
        // Check if the database URL is provided
        if (process.env["CHAT_APP_DATABASE_URL"]) {
            await connectToDatabase();
            conversations = await Conversation.find(); // Fetch all conversations

            const messages = await Message.find();

            conversations = conversations.map((conversation) => {
                const conversationMessages = messages.filter(
                    (message) => message.conversationId === conversation.conversationId
                );
                return {
                    ...conversation.toObject(),
                    messages: conversationMessages,
                };
            });
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
    if (event.httpMethod === 'OPTIONS') {
        console.log("CORS preflight request success");
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",  // Allow all origins
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",  // Allow methods
                "Access-Control-Allow-Headers": "Content-Type",  // Allow headers
            },
            body: JSON.stringify({ message: "CORS preflight request success" }),
        };
    }
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
        if(process.env["CHAT_APP_DATABASE_URL"])   {
            await connectToDatabase();
            messages = await Conversation.findOne({ conversationId }); // Fetch messages for the conversation
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
    if (event.httpMethod === 'OPTIONS') {
        console.log("CORS preflight request success");
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*",  // Allow all origins
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",  // Allow methods
                "Access-Control-Allow-Headers": "Content-Type",  // Allow headers
            },
            body: JSON.stringify({ message: "CORS preflight request success" }),
        };
    }
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

    let answer;
    try {
        if(process.env["CHAT_APP_DATABASE_URL"])   {
            await connectToDatabase();
            const conversation = await Conversation.findOne({ conversationId });

            if (!conversation) {
                console.log("Creating new conversation");
                const newConversation = new Conversation({
                    conversationId: conversationId,
                    name: `Conversation ${conversationId}`,
                    messages: [],
                });
                await newConversation.save();
            }

            const message = new Message({
                conversationId: conversationId,
                text: newMessageText,
                author: "human",
            });
            await message.save(); // Save the new message
            console.log("Message added", newMessageText);

            // Initialize OpenAI API
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            // Send the message to OpenAI and wait for the response
            if (openai) {
              try {
                const completion = await openai.chat.completions.create({
                  model: 'gpt-4o',
                  messages: [{ role: 'user', content: newMessageText}],
                });
                answer = completion.choices[0].message.content;
              } catch (error) {
                console.log(error);
              }

              console.log("AI response:", answer);
              // Save the AI response as a new message
              const aiMessage = new Message({
                conversation_id: conversationId,
                text: answer,
                author: 'ai',
              });
              await aiMessage.save(); // Save the AI response
            }
        } else {
            console.warn("No database URL provided, using mock data.");
            console.log("Mock: Message added", newMessageText); // Log mock message addition
            answer = "This is a mock response"; // Mock response when DB not connected
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Message added successfully", answer }),
        };
    } catch (error) {
        console.warn("Could not connect to the database, using mock data.", error);
        console.log("Mock: Message added", newMessageText); // Log mock message addition
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Message added successfully" }),
    };
};
