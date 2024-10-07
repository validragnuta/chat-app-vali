/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

// Types for our data structure
interface Message {
  id: string
  author: "system" | "user"
  content: string
  timestamp: string
}

interface Conversation {
  id: string
  conversationId: string
  name: string
  messages: Message[]
}

const API_URL_GET_ALL_CONVERSATIONS = import.meta.env.VITE_API_URL_GET_ALL_CONVERSATIONS
// const API_URL_GET_CONVERSATION = import.meta.env.VITE_API_URL_GET_CONVERSATION
const API_URL_PUT_MESSAGE = import.meta.env.VITE_API_URL_PUT_MESSAGE

// Mock API call - replace this with your actual API call
const fetchConversations = async (): Promise<Conversation[]> => {
  // Simulating API delay (you can remove this if you want to directly fetch)
  await new Promise(resolve => setTimeout(resolve, 1000));

  try {
    const response = await fetch(`${API_URL_GET_ALL_CONVERSATIONS}/conversations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const conversations = await data.conversations.map((conv: any) => ({
      id: conv.conversationId,
      messages: conv.messages.map((msg: any) => ({
        id: msg.id,
        author: msg.author === "human" ? "user" : "system", // Map agent to author
        content: msg.text,
        timestamp: new Date().toISOString(), // Replace with actual timestamp if available
      })),
    })) as Conversation[]

    return conversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return []; // Return an empty array in case of an error
  }
};

const addMessageToConversation = async (conversationId: string, message: string): Promise<void> => {
  try {
    const response = await fetch(`${API_URL_PUT_MESSAGE}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId: conversationId, // Conversation ID
        author: "human",
        message: message, // Message content from the user
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Message added successfully:", data.message);
  } catch (error) {
    console.error("Error adding message:", error);
  }
};

export default function ChatUI() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const loadConversations = async () => {
      const data = await fetchConversations()
      setConversations(data)
      if (data.length > 0) {
        setActiveConversation(data[0].id)
      }
    }
    loadConversations()
  }, [])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() === "" || !activeConversation) return

    const updatedConversations = conversations.map(conv => {
      if (conv.conversationId === activeConversation) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now().toString(),
              author: "user",
              content: newMessage,
              timestamp: new Date().toISOString()
            },
          ]
        }
      }
      return conv
    }) as Conversation[]

    setConversations(updatedConversations)

    const aiResponse = await addMessageToConversation(activeConversation, newMessage)
    const updatedAIConversations = conversations.map(conv => {
      if (conv.conversationId === activeConversation) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now().toString(),
              author: "system",
              content: aiResponse,
              timestamp: new Date().toISOString()
            },
          ]
        }
      }
      return conv
    }) as Conversation[]

    setConversations(updatedAIConversations)
    setNewMessage("")
  }

  const currentConversation = conversations.find(conv => conv.id === activeConversation)

  return (
    <div className="flex h-screen">
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden fixed left-4 top-4 z-10">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
          <nav className="flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4">Conversations</h2>
            <ScrollArea className="flex-grow">
              {conversations.map((conv) => (
                <Button
                  key={conv.id}
                  variant={conv.id === activeConversation ? "secondary" : "ghost"}
                  className="w-full justify-start mb-2 text-primary"
                  onClick={() => {
                    setActiveConversation(conv.conversationId)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Conversation {conv.conversationId}
                </Button>
              ))}
            </ScrollArea>
          </nav>
        </SheetContent>
      </Sheet>

      <nav className="hidden lg:block w-64 border-r p-4">
        <h2 className="text-lg font-semibold mb-4">Conversations</h2>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {conversations.map((conv) => (
            <Button
              key={conv.id}
              variant={conv.id === activeConversation ? "secondary" : "ghost"}
              className="w-full justify-start mb-2"
              onClick={() => setActiveConversation(conv.id)}
            >
              Conversation {conv.id}
            </Button>
          ))}
        </ScrollArea>
      </nav>

      <main className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Chat {activeConversation ? `- ${activeConversation}` : ""}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4">
              {currentConversation?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex mb-4 ${
                    message.author === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex items-start ${
                      message.author === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{message.author === "user" ? "U" : "S"}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`mx-2 px-4 py-2 rounded-lg ${
                        message.author === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p>{message.content}</p>
                      <span className="text-xs opacity-50">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
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
      </main>
    </div>
  )
}
