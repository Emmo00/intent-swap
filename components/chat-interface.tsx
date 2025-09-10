"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content:
        "Welcome to IntentSwap! I'm your AI trading assistant. Tell me what you'd like to swap and I'll handle it for you.",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I understand you want to ${inputValue}. Let me process this swap for you...`,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMessage])
    }, 1000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-4 brutalist-border font-mono text-sm ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground ml-4"
                    : "bg-card text-card-foreground mr-4"
                } brutalist-shadow`}
              >
                {/* Message content */}
                <div className="mb-2">{message.content}</div>

                {/* Timestamp */}
                <div
                  className={`text-xs opacity-70 ${
                    message.sender === "user" ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>

                {/* Terminal-style indicator */}
                <div className="flex items-center gap-1 mt-2">
                  <div className="w-2 h-2 bg-current opacity-50 rounded-full"></div>
                  <div className="text-xs opacity-50 font-black">{message.sender === "user" ? "USER" : "AI_AGENT"}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-4 brutalist-border border-t-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your swap instruction... (e.g., 'swap 0.5 ETH for USDC')"
              className="brutalist-border bg-input text-foreground font-mono pr-12"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-black">
              ENTER
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="brutalist-border brutalist-shadow bg-primary text-primary-foreground hover:bg-primary/90 font-black px-6"
          >
            SEND
          </Button>
        </div>

        {/* Terminal-style prompt indicator */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
          <div className="text-primary font-black">$</div>
          <div>Ready for swap instructions...</div>
          <div className="w-2 h-3 bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
