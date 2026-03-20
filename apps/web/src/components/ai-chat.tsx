'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { SendHorizonal, Bot } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Message {
  role: 'interviewer' | 'candidate'
  content: string
  timestamp: string
}

interface AiChatProps {
  roundSessionId: string
  token: string
  initialMessages?: Message[]
  codeRef: React.MutableRefObject<string>
  company: string
  maxInteractions?: number
  disabled?: boolean
}

export function AiChat({
  roundSessionId,
  token,
  initialMessages = [],
  codeRef,
  company,
  maxInteractions = 20,
  disabled = false,
}: AiChatProps) {
  const [messages, setMessages] = useState<Message[]>(
    initialMessages.length > 0
      ? initialMessages
      : [
          {
            role: 'interviewer',
            content: `Hi! I'm your ${company} interviewer today. Take a moment to read the problem, then walk me through your initial approach before you start coding.`,
            timestamp: new Date().toISOString(),
          },
        ],
  )
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [interactionCount, setInteractionCount] = useState(
    initialMessages.filter((m) => m.role === 'interviewer').length,
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isStreaming])

  const sendInteraction = useCallback(
    async (message?: string) => {
      if (isStreaming || interactionCount >= maxInteractions || disabled) return

      const code = codeRef.current || ''
      const userMessage = message?.trim() || ''

      setIsStreaming(true)

      // Add candidate message if there's text
      const newMessages: Message[] = [...messages]
      if (userMessage) {
        const candidateMsg: Message = {
          role: 'candidate',
          content: userMessage,
          timestamp: new Date().toISOString(),
        }
        newMessages.push(candidateMsg)
        setMessages(newMessages)
      }
      setInput('')

      // Add placeholder for streaming response
      const placeholderMsg: Message = {
        role: 'interviewer',
        content: '',
        timestamp: new Date().toISOString(),
      }
      setMessages([...newMessages, placeholderMsg])

      try {
        const res = await fetch(
          `${API_URL}/api/round-sessions/${roundSessionId}/ai-interact`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ code, message: userMessage || undefined }),
          },
        )

        if (!res.ok) {
          const err = await res.json()
          if (err.status === 'throttled' || err.status === 'limit_reached') {
            setMessages(newMessages) // remove placeholder
            return
          }
          throw new Error(err.error || 'AI interaction failed')
        }

        // Stream the response
        const reader = res.body?.getReader()
        const decoder = new TextDecoder()
        let fullText = ''

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            // Parse SSE data chunks
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (line.startsWith('0:')) {
                // Vercel AI SDK data stream format: 0:"text chunk"
                try {
                  const textChunk = JSON.parse(line.slice(2))
                  fullText += textChunk
                  setMessages((prev) => {
                    const updated = [...prev]
                    updated[updated.length - 1] = {
                      role: 'interviewer',
                      content: fullText,
                      timestamp: new Date().toISOString(),
                    }
                    return updated
                  })
                } catch {
                  // skip malformed chunks
                }
              }
            }
          }
        }

        setInteractionCount((prev) => prev + 1)
      } catch (err) {
        // Remove placeholder on error
        setMessages(newMessages)
        console.error('AI interaction error:', err)
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming, interactionCount, maxInteractions, disabled, codeRef, messages, roundSessionId, token],
  )

  const handleSend = () => {
    if (input.trim()) {
      sendInteraction(input.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const remaining = maxInteractions - interactionCount

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">AI Interviewer</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {company}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {interactionCount}/{maxInteractions}
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                msg.role === 'candidate'
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-muted text-foreground rounded-bl-sm'
              }`}
            >
              {msg.content || (
                <span className="flex gap-1 items-center text-muted-foreground text-xs">
                  <span className="animate-bounce">●</span>
                  <span className="animate-bounce [animation-delay:0.1s]">●</span>
                  <span className="animate-bounce [animation-delay:0.2s]">●</span>
                </span>
              )}
            </div>
          </div>
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3 py-2">
              <span className="flex gap-1 items-center text-xs text-muted-foreground">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.1s]">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 space-y-2">
        {remaining <= 5 && remaining > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            {remaining} interaction{remaining !== 1 ? 's' : ''} remaining
          </p>
        )}
        {remaining === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Maximum interactions reached
          </p>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Explain your approach or ask a question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming || remaining === 0 || disabled}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || remaining === 0 || disabled}
          >
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          The interviewer observes your code automatically
        </p>
      </div>
    </div>
  )
}
