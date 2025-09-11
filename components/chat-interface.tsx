"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"

interface Message {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
  functionCalls?: any[]
  isProcessing?: boolean
}

export function ChatInterface() {
  const { isConnected, address } = useAuth()
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
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Mock function call handler
  const handleFunctionCalls = useCallback(async (functionCalls: any[]) => {
    console.log('🔧 Handling function calls:', functionCalls)
    
    const results = []
    for (const call of functionCalls) {
      switch (call.name) {
        case 'swap_tokens':
          console.log(`🔄 Mock swap: ${call.args.sellToken} → ${call.args.buyToken}`)
          results.push({
            name: call.name,
            result: `Mock swap executed: ${call.args.sellAmount} ${call.args.sellToken} → ${call.args.buyToken}`,
            success: true
          })
          break
        case 'get_token_price':
          console.log(`💰 Mock price check for: ${call.args.token}`)
          results.push({
            name: call.name,
            result: `Mock price for ${call.args.token}: $${(Math.random() * 100).toFixed(2)}`,
            success: true
          })
          break
        case 'check_balance':
          console.log(`💳 Mock balance check for: ${call.args.token}`)
          results.push({
            name: call.name,
            result: `Mock balance for ${call.args.token}: ${(Math.random() * 1000).toFixed(4)}`,
            success: true
          })
          break
        default:
          console.log(`❓ Unknown function call: ${call.name}`)
          results.push({
            name: call.name,
            result: `Unknown function: ${call.name}`,
            success: false
          })
      }
    }
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500))
    return results
  }, [])

  const callChatAPI = useCallback(async (message: string, role: 'user' | 'system' = 'user') => {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
        role,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  }, [sessionId])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    try {
      // Call the chat API
      const apiResponse = await callChatAPI(currentInput, 'user')
      
      if (apiResponse.success && apiResponse.aiResponse) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: apiResponse.aiResponse.content,
          sender: "ai",
          timestamp: new Date(),
          functionCalls: apiResponse.functionCalls || [],
          isProcessing: (apiResponse.functionCalls && apiResponse.functionCalls.length > 0)
        }
        
        setMessages((prev) => [...prev, aiMessage])
        
        // Handle function calls if present
        if (apiResponse.functionCalls && apiResponse.functionCalls.length > 0) {
          const functionResults = await handleFunctionCalls(apiResponse.functionCalls)
          
          // Update message with function results
          setMessages((prev) => prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, isProcessing: false, functionResults } 
              : msg
          ))
          
          // Send function results back to agent if needed
          const resultsMessage = `Function call results: ${functionResults.map(r => 
            `${r.name}: ${r.result}`
          ).join(', ')}`
          
          const followupResponse = await callChatAPI(resultsMessage, 'system')
          
          if (followupResponse.success && followupResponse.aiResponse) {
            const followupMessage: Message = {
              id: (Date.now() + 2).toString(),
              content: followupResponse.aiResponse.content,
              sender: "ai",
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, followupMessage])
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your request. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Chat Messages */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full p-3 md:p-4">
          <div className="space-y-3 md:space-y-4 pb-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] md:max-w-[80%] p-3 md:p-4 brutalist-border font-mono text-xs md:text-sm ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground ml-2 md:ml-4"
                      : "bg-card text-card-foreground mr-2 md:mr-4"
                  } shadow-[4px_4px_0px_var(--border)] md:shadow-[8px_8px_0px_var(--border)]`}
                >
                  {/* Message content */}
                  <div className="mb-2">{message.content}</div>

                  {/* Function calls display */}
                  {message.functionCalls && message.functionCalls.length > 0 && (
                    <div className="mt-3 p-2 bg-muted/50 brutalist-border border-2">
                      <div className="text-xs font-black mb-2 text-muted-foreground">FUNCTION_CALLS:</div>
                      <div className="space-y-2">
                        {message.functionCalls.map((call, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-mono text-xs">
                              {call.name}
                            </Badge>
                            {message.isProcessing ? (
                              <div className="text-xs text-muted-foreground animate-pulse">Processing...</div>
                            ) : (
                              <div className="text-xs text-muted-foreground">✓ Executed</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Function results display */}
                  {(message as any).functionResults && (
                    <div className="mt-3 p-2 bg-green-100/50 dark:bg-green-900/20 brutalist-border border-2">
                      <div className="text-xs font-black mb-2 text-green-700 dark:text-green-400">RESULTS:</div>
                      <div className="space-y-1">
                        {(message as any).functionResults.map((result: any, index: number) => (
                          <div key={index} className="text-xs">
                            <span className="font-black">{result.name}:</span> {result.result}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <div
                    className={`text-xs opacity-70 mt-2 ${
                      message.sender === "user" ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  {/* Terminal-style indicator */}
                  <div className="flex items-center gap-1 mt-2">
                    <div className="w-2 h-2 bg-current opacity-50 rounded-full"></div>
                    <div className="text-xs opacity-50 font-black">{message.sender === "user" ? "USER" : "AI_AGENT"}</div>
                    {message.isProcessing && (
                      <div className="text-xs opacity-50 font-black animate-pulse ml-2">PROCESSING...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Input Area - Fixed at bottom */}
      <div className="flex-shrink-0 p-3 md:p-4 brutalist-border border-t-4 bg-background">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isConnected ? "Type swap instruction..." : "Connect wallet to start swapping..."}
              disabled={!isConnected || isLoading}
              className="brutalist-border bg-input text-foreground font-mono pr-12 text-sm"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-black">
              ENTER
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !isConnected || isLoading}
            className="brutalist-border bg-primary text-primary-foreground hover:bg-primary/90 font-black px-4 md:px-6 shadow-[4px_4px_0px_var(--border)] md:shadow-[8px_8px_0px_var(--border)]"
          >
            <span className="hidden sm:inline">{isLoading ? 'SENDING...' : 'SEND'}</span>
            <span className="sm:hidden">{isLoading ? '...' : '→'}</span>
          </Button>
        </div>

        {/* Terminal-style prompt indicator */}
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
          <div className="text-primary font-black">$</div>
          <div className="hidden sm:inline">Ready for swap instructions...</div>
          <div className="sm:hidden">Ready...</div>
          <div className="w-2 h-3 bg-primary animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}
