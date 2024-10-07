import express from 'express';
import pg from 'pg';
import serverless from 'serverless-http';
import cors from "cors";

const { Client } = pg;

const app = express();
app.use(express.json());
app.use(cors());

// Helper function to get the database client
const getDbClient = () => {
    const dbUrl = process.env.CHAT_APP_DATABASE_URL;
    return dbUrl ? new Client({ connectionString: dbUrl }) : null;
};

app.get('/', (req, res) => {
    return res.status(200).json({ message: "Hello from the backend!" });
});

// Route to fetch all conversations
app.get('/conversations', async (req, res) => {
    console.log("Fetching all conversations");

    let conversations;
    const client = getDbClient();

    if (client) {
        await client.connect();
        try {
            const result = await client.query('SELECT * FROM conversations');
            conversations = result.rows;
        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Error fetching conversations" });
        } finally {
            await client.end();
        }
    } else {
        conversations = [
            { id: 1, name: "conv-123456" },
            { id: 2, name: "conv-567890" },
        ];
    }

    return res.status(200).json({ conversations });
});

// Route to fetch all messages from a specific conversation
app.get('/conversations/:conversationId/messages', async (req, res) => {
    console.log("Fetching messages from conversation");

    const conversationId = req.params.conversationId;
    let messages;
    const client = getDbClient();

    if (client) {
        await client.connect();
        try {
            const result = await client.query('SELECT * FROM messages WHERE conversation_id = $1', [conversationId]);
            messages = result.rows;
        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Error fetching messages" });
        } finally {
            await client.end();
        }
    } else {
        messages = [
            { id: 1, text: "Hello!", conversation_id: conversationId },
            { id: 2, text: "How's it going?", conversation_id: conversationId },
        ];
    }

    return res.status(200).json({ messages });
});

// Route to add a message to a specific conversation
app.post('/conversations/:conversationId/messages', async (req, res) => {
    console.log("Adding message to conversation");

    const conversationId = req.params.conversationId;
    const { message } = req.body;
    const client = getDbClient();

    if (client) {
        await client.connect();
        try {
            await client.query('INSERT INTO messages (text, conversation_id) VALUES ($1, $2)', [message, conversationId]);
        } catch (error) {
            console.error("Database error:", error);
            return res.status(500).json({ message: "Error adding message" });
        } finally {
            await client.end();
        }
    } else {
        console.log("Mock: Message added", message);
    }

    return res.status(200).json({ message: "Message added successfully" });
});

// Export the app wrapped with serverless-http to handle the Lambda function
export const handler = serverless(app);
