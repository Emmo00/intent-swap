"use client"

import React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
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

interface ChatInterfaceProps {
  sessionId?: string
  onSessionChange?: (newSessionId: string) => void
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center space-x-1">
      <span className="text-xs font-black text-muted-foreground mr-2">AI_AGENT_THINKING</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
      </div>
    </div>
  )
}

export function ChatInterface({ sessionId: propSessionId, onSessionChange }: ChatInterfaceProps = {}) {
  const { isConnected, address } = useAuth()
  const scrollAreaRef = useRef<HTMLDivElement>(null)
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
  const [currentSessionId, setCurrentSessionId] = useState(() => 
    propSessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  )
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Auto-scroll to bottom function
  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [])

  // Auto-scroll when messages change
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100) // Small delay to ensure DOM is updated
    return () => clearTimeout(timeoutId)
  }, [messages, scrollToBottom])

  // Update session when prop changes
  useEffect(() => {
    if (propSessionId && propSessionId !== currentSessionId) {
      setCurrentSessionId(propSessionId)
      loadChatHistory(propSessionId)
    }
  }, [propSessionId, currentSessionId])

  // Load chat history for a specific session
  const loadChatHistory = async (targetSessionId: string) => {
    if (!isConnected) return

    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/agent/chat?sessionId=${targetSessionId}`, {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.messages) {
          // Convert database messages to UI messages
          const loadedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
            id: `loaded_${index}`,
            content: msg.content,
            sender: msg.role === 'user' ? 'user' : 'ai',
            timestamp: new Date(data.createdAt),
          }))
          
          // If no messages in history, show welcome message
          if (loadedMessages.length === 0) {
            setMessages([
              {
                id: "1",
                content: "Welcome to IntentSwap! I'm your AI trading assistant. Tell me what you'd like to swap and I'll handle it for you.",
                sender: "ai",
                timestamp: new Date(),
              },
            ])
          } else {
            setMessages(loadedMessages)
          }
        }
      } else if (response.status === 404) {
        // Session doesn't exist yet, start fresh
        setMessages([
          {
            id: "1",
            content: "Welcome to IntentSwap! I'm your AI trading assistant. Tell me what you'd like to swap and I'll handle it for you.",
            sender: "ai",
            timestamp: new Date(),
          },
        ])
      } else {
        console.error('Failed to load chat history:', response.statusText)
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Function to switch to a different session
  const switchSession = (newSessionId: string) => {
    setCurrentSessionId(newSessionId)
    loadChatHistory(newSessionId)
    onSessionChange?.(newSessionId)
  }

  // Real function call handler with API integration
  const handleFunctionCalls = useCallback(async (functionCalls: any[]) => {
    console.log('🔧 Handling function calls:', functionCalls)
    
    const results = []
    for (const call of functionCalls) {
      try {
        let result = 'Unknown function'
        
        switch (call.name) {
          case 'check_balance':
            try {
              // Parse arguments - could be string or object
              const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments
              const { token_symbol } = args
              
              console.log(`💳 Real balance check for: ${token_symbol}`)
              const balanceResponse = await fetch('/api/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: token_symbol }),
              })
              
              if (balanceResponse.ok) {
                const balanceData = await balanceResponse.json()
                result = `${balanceData.balance} ${balanceData.symbol}`
              } else {
                result = `Error checking balance: ${balanceResponse.statusText}`
              }
            } catch (error) {
              console.error('Balance check error:', error)
              result = `Error checking balance: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
            break
            
          case 'get_price':
            try {
              const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments
              const { sell_token, buy_token, amount } = args
              
              console.log(`📊 Real price check: ${sell_token} → ${buy_token}`)
              const priceResponse = await fetch('/api/swap/price', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  sellToken: sell_token,
                  buyToken: buy_token,
                  sellAmount: amount 
                }),
              })
              
              if (priceResponse.ok) {
                const priceData = await priceResponse.json()
                result = `${priceData.buyAmount} ${buy_token} (Price: ${priceData.price})`
              } else {
                result = `Error getting price: ${priceResponse.statusText}`
              }
            } catch (error) {
              console.error('Price check error:', error)
              result = `Error getting price: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
            break
            
          case 'get_quote':
            try {
              const args = typeof call.arguments === 'string' ? JSON.parse(call.arguments) : call.arguments
              const { sell_token, buy_token, amount } = args
              
              console.log(`� Real quote: ${sell_token} → ${buy_token}`)
              const quoteResponse = await fetch('/api/swap/quote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  sellToken: sell_token,
                  buyToken: buy_token,
                  sellAmount: amount 
                }),
              })
              
              if (quoteResponse.ok) {
                const quoteData = await quoteResponse.json()
                result = `Quote: ${quoteData.buyAmount} ${buy_token} (Gas: ${quoteData.estimatedGas || 'N/A'})`
              } else {
                result = `Error getting quote: ${quoteResponse.statusText}`
              }
            } catch (error) {
              console.error('Quote error:', error)
              result = `Error getting quote: ${error instanceof Error ? error.message : 'Unknown error'}`
            }
            break
            
          default:
            console.log(`❓ Unknown function call: ${call.name}`)
            result = `Unknown function: ${call.name}`
        }
        
        results.push({ 
          name: call.name, 
          result, 
          success: !result.includes('Error') 
        })
      } catch (error) {
        console.error(`Error executing function ${call.name}:`, error)
        results.push({ 
          name: call.name, 
          result: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          success: false
        })
      }
    }
    
    // Small delay for UX
    await new Promise(resolve => setTimeout(resolve, 800))
    return results
  }, [])

  const callChatAPI = useCallback(async (message: string, role: 'user' | 'system' = 'user') => {
    const response = await fetch('/api/agent/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        role,
        message,
      }),
    })

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`)
    }

    return response.json()
  }, [currentSessionId])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConnected) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    // Add typing indicator message
    const typingMessage: Message = {
      id: `typing_${Date.now()}`,
      content: "",
      sender: "ai",
      timestamp: new Date(),
      isProcessing: true,
    }

    setMessages((prev) => [...prev, userMessage, typingMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    // Immediate scroll after adding user message
    setTimeout(scrollToBottom, 50)

    try {
      // Call the chat API
      const apiResponse = await callChatAPI(currentInput, 'user')
      
      if (apiResponse.success && apiResponse.aiResponse) {
        // Check if the response has meaningful content or just function calls
        const hasContent = apiResponse.aiResponse.content && 
                          apiResponse.aiResponse.content.trim() && 
                          apiResponse.aiResponse.content !== '[object Object]' &&
                          !apiResponse.aiResponse.content.includes('[object Object]')
        
        const hasFunctionCalls = apiResponse.functionCalls && apiResponse.functionCalls.length > 0

        if (hasFunctionCalls && !hasContent) {
          // Pure function call response - show function processing message
          const functionMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: "", // No content, just function calls
            sender: "ai",
            timestamp: new Date(),
            functionCalls: apiResponse.functionCalls,
            isProcessing: true
          }
          
          // Replace typing indicator with function processing message
          setMessages((prev) => prev.map(msg => 
            msg.id.startsWith('typing_') ? functionMessage : msg
          ))

          // Execute function calls
          const functionResults = await handleFunctionCalls(apiResponse.functionCalls)
          
          // Update message to show completion
          setMessages((prev) => prev.map(msg => 
            msg.id === functionMessage.id 
              ? { ...msg, isProcessing: false, functionResults } 
              : msg
          ))
          
          // Send function results back to agent as system message
          const resultsMessage = functionResults.map(r => 
            `${r.name}: ${r.result}`
          ).join('\n')
          
          const followupResponse = await callChatAPI(resultsMessage, 'system')
          
          if (followupResponse.success && followupResponse.aiResponse && followupResponse.aiResponse.content) {
            const followupMessage: Message = {
              id: (Date.now() + 2).toString(),
              content: followupResponse.aiResponse.content,
              sender: "ai",
              timestamp: new Date(),
            }
            setMessages((prev) => [...prev, followupMessage])
          }
        } else {
          // Regular message with content (and possibly function calls)
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: hasContent ? apiResponse.aiResponse.content : "I'm processing your request...",
            sender: "ai",
            timestamp: new Date(),
            functionCalls: apiResponse.functionCalls || [],
            isProcessing: hasFunctionCalls
          }
          
          // Replace typing indicator with actual response
          setMessages((prev) => prev.map(msg => 
            msg.id.startsWith('typing_') ? aiMessage : msg
          ))
          
          // Handle function calls if present
          if (hasFunctionCalls) {
            const functionResults = await handleFunctionCalls(apiResponse.functionCalls)
            
            // Update message with function results
            setMessages((prev) => prev.map(msg => 
              msg.id === aiMessage.id 
                ? { ...msg, isProcessing: false, functionResults } 
                : msg
            ))
            
            // Send function results back to agent as system message
            const resultsMessage = functionResults.map(r => 
              `${r.name}: ${r.result}`
            ).join('\n')
            
            const followupResponse = await callChatAPI(resultsMessage, 'system')
            
            if (followupResponse.success && followupResponse.aiResponse && followupResponse.aiResponse.content) {
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
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your request. Please try again.",
        sender: "ai",
        timestamp: new Date(),
      }
      // Replace typing indicator with error message
      setMessages((prev) => prev.map(msg => 
        msg.id.startsWith('typing_') ? errorMessage : msg
      ))
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
    <div className="flex flex-col h-full min-h-0 relative">
      {/* Loading overlay for chat history */}
      {isLoadingHistory && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="p-4 brutalist-border bg-card text-card-foreground font-mono text-sm shadow-[8px_8px_0px_var(--border)]">
            <div className="flex items-center gap-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
              </div>
              <span className="font-black">LOADING_HISTORY...</span>
            </div>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full p-3 md:p-4">
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
                  {/* Message content or typing indicator */}
                  {message.content && 
                   message.content.trim() && 
                   message.content !== '[object Object]' && 
                   !message.content.includes('[object Object]') ? (
                    <div className="mb-2">{message.content}</div>
                  ) : message.isProcessing && message.sender === "ai" ? (
                    <div className="mb-2">
                      <TypingIndicator />
                    </div>
                  ) : message.sender === "user" ? (
                    <div className="mb-2">{message.content || "..."}</div>
                  ) : null}

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
                    <div className="text-xs opacity-50 font-black">
                      {message.sender === "user" 
                        ? "USER" 
                        : message.isProcessing && !message.content
                          ? "AI_AGENT_THINKING"
                          : "AI_AGENT"
                      }
                    </div>
                    {message.isProcessing && (
                      <div className="text-xs opacity-50 font-black animate-pulse ml-2">
                        {!message.content ? "THINKING..." : "PROCESSING..."}
                      </div>
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
