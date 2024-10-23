/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaGithub } from 'react-icons/fa';
import { FaTrash } from 'react-icons/fa6';

// Types for our data structure
interface Message {
  id: string;
  author: 'system' | 'user';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  conversationId: string;
  name: string;
  messages: Message[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Mock API call - replace this with your actual API call
const fetchConversations = async (): Promise<Conversation[]> => {
  // Simulating API delay (you can remove this if you want to directly fetch)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    const response = await fetch(`${API_URL}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const conversations = (await data.conversations.map((conv: any) => ({
      id: conv.conversationId,
      messages: conv.messages.map((msg: any) => ({
        id: msg.id,
        author: msg.author === 'human' ? 'user' : 'system', // Map agent to author
        content: msg.text,
        timestamp: new Date().toISOString(), // Replace with actual timestamp if available
      })),
    }))) as Conversation[];

    return conversations;
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return []; // Return an empty array in case of an error
  }
};

const addMessageToConversation = async (
  conversationId: string,
  message: string,
): Promise<string | undefined> => {
  try {
    const response = await fetch(
      `${API_URL}/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          author: 'human',
          message: message,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error adding message:', error);
  }

  return undefined;
};

const deleteConversation = async (conversationId: string) => {
  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error('Error deleting conversation:', error);
  }
  return undefined;
};

export default function ChatUI() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true); // Start loading

      try {
        const data = await fetchConversations();
        setConversations(data);
        if (data.length > 0) {
          setActiveConversation(data[0]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        // Optionally handle errors here (e.g., set error state)
      } finally {
        setIsLoading(false); // Stop loading after conversations are fetched or an error occurs
      }
    };

    loadConversations();
  }, []);

  // useEffect(() => {}, [conversations, activeConversation]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' && !activeConversation) return;
    const message = newMessage.trim();
    setNewMessage('');

    // Add the user's message to the conversation
    const updatedConversations = conversations.map((conv) => {
      if (
        activeConversation &&
        conv.conversationId === activeConversation.conversationId
      ) {
        const updatedConv = {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now().toString(),
              author: 'user',
              content: message,
              timestamp: new Date().toISOString(),
            },
          ],
        } as Conversation;
        setActiveConversation(updatedConv);
        return updatedConv;
      }
      return conv;
    }) as Conversation[];
    await setConversations(updatedConversations);

    // Show the "typing..." card
    setIsTyping(true);

    const aiResponse = await addMessageToConversation(
      activeConversation!.id,
      message,
    );

    // After receiving the system response, remove the "typing..." message and add the system's response
    const updatedAIConversations = updatedConversations.map((conv) => {
      if (
        activeConversation &&
        conv.conversationId === activeConversation.conversationId
      ) {
        const updatedConv = {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now().toString(),
              author: 'system',
              content: aiResponse,
              timestamp: new Date().toISOString(),
            },
          ],
        } as Conversation;
        setActiveConversation(updatedConv);
        return updatedConv;
      }
      return conv;
    }) as Conversation[];

    setIsTyping(false); // Hide the "typing..." indicator
    await setConversations(updatedAIConversations);
  };

  const handleDeletedConversation = async (conversationId: string) => {
    const response = await deleteConversation(conversationId);
    if (!response.message.includes('not implemented')) {
      setConversations(
        conversations.filter((conv) => conv.id !== conversationId),
      );

      if (conversations.length > 0) {
        setActiveConversation(conversations[0]);
      } else {
        setActiveConversation(null);
      }
    }
  };

  const generateRandomId = () => {
    return Math.random().toString(36).substring(2, 6); // Generates a random 4-character string
  };

  const Spinner = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-300 border-t-transparent"></div>
  );

  return (
    <div className="flex h-screen bg-white">
      <nav className="hidden lg:block w-64 p-4">
        <Button
          key={'repository-link'}
          variant={'link'}
          className="w-full mb-2"
          onClick={() =>
            window.open('https://github.com/Genez-io/chat-app', '_blank')
          }
        >
          <FaGithub className="mr-2" /> Check Source Code
        </Button>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {isLoading ? ( // Show spinner if loading
            <div className="flex justify-center items-center h-full">
              <Spinner />
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="flex items-center mb-2">
                <Button
                  variant={
                    conv.id === activeConversation?.id ? 'default' : 'secondary'
                  }
                  className="w-full flex-1"
                  onClick={() => setActiveConversation(conv)}
                >
                  Conversation {conv.id}
                </Button>
                <button
                  className="ml-2 p-2 bg-gray-200 text-red-500 hover:text-red-700" // Style the delete button
                  onClick={() => handleDeletedConversation(conv.id)} // Call the delete function
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
          {/* Add a new conversation button */}
          <Button
            variant="secondary"
            className="w-full mb-2"
            onClick={() => {
              const newConversationId = `${generateRandomId()}`;
              setConversations([
                ...conversations,
                {
                  id: newConversationId,
                  conversationId: newConversationId,
                  name: `Conversation ${newConversationId}`,
                  messages: [],
                },
              ]);
              setActiveConversation({
                id: newConversationId,
                conversationId: newConversationId,
                name: `Conversation ${newConversationId}`,
                messages: [],
              });
            }}
          >
            New Conversation
          </Button>
        </ScrollArea>
      </nav>

      {activeConversation && (
        <main className="flex-1 flex flex-col w-full">
          <Card className="flex-1 flex flex-col w-full max-h-[calc(100vh-8rem)]">
            <CardHeader>
              <CardTitle>
                Chat {activeConversation ? `- ${activeConversation.id}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea
                className="flex-1 pr-4 bg-white overflow-y-auto max-h-[calc(80vh-8rem)]"
                style={{ width: '90vh' }}
              >
                {activeConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex mb-4 ${
                      message.author === 'user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`flex items-start ${
                        message.author === 'user'
                          ? 'flex-row-reverse'
                          : 'flex-row'
                      }`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>
                          {message.author === 'user' ? 'U' : 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`mx-2 px-4 py-2 rounded-lg ${
                          message.author === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p>{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Show typing indicator */}
                {isTyping && (
                  <div className="flex mb-4 justify-start">
                    <div className="flex items-start">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>S</AvatarFallback>
                      </Avatar>
                      <div className="mx-2 px-4 py-2 rounded-lg bg-muted">
                        <p>...</p>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollArea>
              <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                />
                <Button type="submit">Send</Button>
              </form>
            </CardContent>
          </Card>
          <footer className="p-4 text-center text-sm text-gray-600 rounded-b-lg">
            Made with ❤️ with{' '}
            <a
              href="https://genezio.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Genezio
            </a>
          </footer>
        </main>
      )}
    </div>
  );
}
