"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth-context"

interface ChatSession {
  sessionId: string
  title: string
  lastMessage: string
  messageCount: number
  createdAt: string
  updatedAt: string
  preview: string
}

interface ChatHistoryProps {
  onSelectSession: (sessionId: string) => void
  currentSessionId?: string
}

export function ChatHistory({ onSelectSession, currentSessionId }: ChatHistoryProps) {
  const { isConnected } = useAuth()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = async () => {
    if (!isConnected) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agent/sessions', {
        method: 'GET',
        credentials: 'include', // Include cookies for authentication
      })

      if (!response.ok) {
        throw new Error(`Failed to load sessions: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success) {
        setSessions(data.sessions)
      } else {
        throw new Error(data.error || 'Failed to load sessions')
      }
    } catch (err) {
      console.error('Error loading sessions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [isConnected])

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId)
  }

  const handleNewChat = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    onSelectSession(newSessionId)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!isConnected) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <div className="text-sm font-mono">Connect wallet to view chat history</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 md:p-4 brutalist-border border-b-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-black text-foreground">CHAT_HISTORY</div>
          <Badge variant="secondary" className="font-mono text-xs">
            {sessions.length}
          </Badge>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full brutalist-border bg-primary text-primary-foreground hover:bg-primary/90 font-black text-sm shadow-[4px_4px_0px_var(--border)]"
        >
          + NEW_CHAT
        </Button>
      </div>

      {/* Sessions List */}
      <ScrollArea className="flex-1 h-0">
        <div className="p-2">
          {isLoading && (
            <div className="p-4 text-center">
              <div className="text-xs font-mono text-muted-foreground animate-pulse">
                LOADING_SESSIONS...
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <div className="text-xs font-mono text-red-500 mb-2">ERROR:</div>
              <div className="text-xs text-muted-foreground">{error}</div>
              <Button
                onClick={loadSessions}
                variant="outline"
                size="sm"
                className="mt-2 brutalist-border font-black text-xs"
              >
                RETRY
              </Button>
            </div>
          )}

          {!isLoading && !error && sessions.length === 0 && (
            <div className="p-4 text-center">
              <div className="text-xs font-mono text-muted-foreground mb-2">NO_HISTORY</div>
              <div className="text-xs text-muted-foreground">Start a new conversation!</div>
            </div>
          )}

          {sessions.map((session) => (
            <div
              key={session.sessionId}
              onClick={() => handleSelectSession(session.sessionId)}
              className={`p-3 mb-2 brutalist-border cursor-pointer transition-all font-mono text-xs
                ${currentSessionId === session.sessionId
                  ? 'bg-primary text-primary-foreground shadow-[4px_4px_0px_var(--border)]'
                  : 'bg-card text-card-foreground hover:bg-muted/50 shadow-[2px_2px_0px_var(--border)] hover:shadow-[4px_4px_0px_var(--border)]'
                }`}
            >
              {/* Session Title */}
              <div className="font-black mb-1 truncate">
                {session.title}
              </div>

              {/* Last Message Preview */}
              <div className="text-muted-foreground mb-2 line-clamp-2 text-xs">
                {session.lastMessage || session.preview}
              </div>

              {/* Session Info */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono text-xs px-1 py-0">
                    {session.messageCount}
                  </Badge>
                  <div className="text-muted-foreground">MSGS</div>
                </div>
                <div className="text-muted-foreground">
                  {formatDate(session.updatedAt)}
                </div>
              </div>

              {/* Terminal indicator */}
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1 h-1 bg-current opacity-50 rounded-full"></div>
                <div className="text-xs opacity-50 font-black">SESSION</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
