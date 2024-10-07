import pg from 'pg';
const { Client } = pg;

// GET /conversations
export const get_all_conversations_handler = async (event) => {
    console.log("Fetching all conversations");

    const dbUrl = process.env.CHAT_APP_DATABASE_URL;
    let conversations;

    if (dbUrl) {
        const client = new Client({ connectionString: dbUrl });
        await client.connect();

        try {
            const res = await client.query('SELECT * FROM conversations');
            conversations = res.rows;
        } catch (error) {
            console.error("Database error:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Error fetching conversations" }),
            };
        } finally {
            await client.end();
        }
    } else {
        conversations = [
            { id: 1, name: "conv-123456" },
            { id: 2, name: "conv-567890" },
        ];
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ conversations }),
    };
};

// GET /conversations/1
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

    const dbUrl = process.env.CHAT_APP_DATABASE_URL;
    if (dbUrl) {
        const client = new Client({ connectionString: dbUrl });
        await client.connect();

        try {
            const res = await client.query('SELECT * FROM messages WHERE conversation_id = $1', [conversationId]);
            messages = res.rows;
        } catch (error) {
            console.error("Database error:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Error fetching messages" }),
            };
        } finally {
            await client.end();
        }
    } else {
        messages = [
            { id: 1, text: "Hello!", conversation_id: conversationId },
            { id: 2, text: "How's it going?", conversation_id: conversationId },
        ];
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ messages }),
    };
};

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
    const newMessage = body.message;

    const dbUrl = process.env.CHAT_APP_DATABASE_URL;
    if (dbUrl) {
        const client = new Client({ connectionString: dbUrl });
        await client.connect();

        try {
            await client.query('INSERT INTO messages (text, conversation_id) VALUES ($1, $2)', [newMessage, conversationId]);
        } catch (error) {
            console.error("Database error:", error);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Error adding message" }),
            };
        } finally {
            await client.end();
        }
    } else {
        console.log("Mock: Message added", newMessage);
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ message: "Message added successfully" }),
    };
};
