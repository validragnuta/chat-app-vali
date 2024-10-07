import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
  messages: Message[]
}

// Mock API call - replace this with your actual API call
const fetchConversations = async (): Promise<Conversation[]> => {
  // Simulating API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return [
    {
      id: "a1b2c3",
      messages: [
        { id: "1", author: "system", content: "Hello! How can I assist you today?", timestamp: "2023-05-01T10:00:00Z" },
        { id: "2", author: "user", content: "I have a question about my account.", timestamp: "2023-05-01T10:01:00Z" },
        { id: "3", author: "system", content: "What would you like to know about your account?", timestamp: "2023-05-01T10:02:00Z" },
      ]
    },
    {
      id: "d4e5f6",
      messages: [
        { id: "1", author: "system", content: "Welcome back! How may I help you today?", timestamp: "2023-05-02T09:00:00Z" },
        { id: "2", author: "user", content: "I need help with a recent order.", timestamp: "2023-05-02T09:05:00Z" },
      ]
    },
  ]
}

export function ChatUi() {
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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (newMessage.trim() === "" || !activeConversation) return

    const updatedConversations = conversations.map(conv => {
      if (conv.id === activeConversation) {
        return {
          ...conv,
          messages: [
            ...conv.messages,
            {
              id: Date.now().toString(),
              author: "user",
              content: newMessage,
              timestamp: new Date().toISOString()
            }
          ]
        }
      }
      return conv
    })

    setConversations(updatedConversations)
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
                  className="w-full justify-start mb-2"
                  onClick={() => {
                    setActiveConversation(conv.id)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Conversation {conv.id}
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