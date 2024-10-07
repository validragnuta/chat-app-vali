# Chat Application - Why Should I deploy on a FaaS cloud Workshop

This repository was used for the live demo during the "Why Should I deploy on a FaaS cloud" workshop.

To seamlessly deploy it on your Genezio account click the following button:

[![Genezio Deploy](https://raw.githubusercontent.com/Genez-io/graphics/main/svg/deploy-button.svg)](https://app.genez.io/start/deploy?repository=https://github.com/andreia-oca/chat-app-demo)

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
- **Lambda-Compatible Functions**: Implemented as individual functions for handling specific requests.
- **Mongo Database**: Stores conversations and messages. If not available, mock data will be used.
- **React Frontend**: Provides a simple interface for interacting with the chat application.

## Support

Feel free to use this repository as a starting point for implementing your on RAG application over OpenAI API.

If you encounter any issues, please leave a [GitHub issue] and I'll try to help you.

## Resources

- https://genezio.com/docs/
