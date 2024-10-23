# Chat Application - Why Should I deploy on a FaaS cloud Workshop

This repository contains a simple chat application that demonstrates how to deploy a serverless application on Genezio.

To seamlessly deploy it on your Genezio account click the following button:

[![Genezio Deploy](https://raw.githubusercontent.com/Genez-io/graphics/main/svg/deploy-button.svg)](https://app.genez.io/start/deploy?repository=https://github.com/genez-io/chat-app)

## Open AI API key

During this workshop you are going to be provided with an Open AI API key.
[Check out this shared spreadsheet to get it](https://docs.google.com/spreadsheets/d/1WxpT6o6912OT7nReseJvbTU9AKXrvwMnJ8QMVyK-35A/edit?usp=sharing).

## Challenge

This repository contains a small challenge for you to interact on your own with the Genezio platform.
The challenge consists of adding a new endpoint to the chat application that allows deleting a conversation and its messages.

Your `TODO` is to implement the DELETE endpoint for deleting a conversation and all its messages:
```typescript
// file: express/app.ts

// DELETE /conversations/:conversationId - Delete a conversation and its messages
// TODO Implement the logic for this endpoint
app.delete('/conversations/:conversationId', async (req: Request, res:Response) => {
  res.json({ message: "Not implemented yet" });
  return;
});
```

The method is called on the frontend side when the user clicks on the delete button for a conversation.

```typescript
  const handleDeletedConversation = async (conversationId: string) => {
    const response = await deleteConversation(conversationId);
    // ...
  };
```

Note: The solution can be found `solution.md` file or in the `solution` branch of this repository.

## Project Overview

The chat application provides functionalities to:
- Fetch all conversations.
- Fetch all messages from a specific conversation.
- Chat with an LLM agent.

## Features

- Serverless architecture with Genezio for easy deployment.
- Mongo for persistent data storage (with fallback to mock data for the live demo).
- Simple REST API for interacting with chat conversations and messages.

## Architecture

The application consists of the following components:
- **Serverless Express Backend**: Provides a REST API for interacting with chat conversations and messages. Deployed in a serverless environment using Genezio.
- **Mongo Database**: Stores conversations and messages. If not available, mock data will be used.
- **React Frontend**: Provides a simple interface for interacting with the chat application.

## Support

Feel free to use this repository as a starting point for implementing your on RAG application over OpenAI API.

If you encounter any issues, please leave a [GitHub issue] and I'll try to help you.

## Resources

- https://genezio.com/
- https://genezio.com/docs/
