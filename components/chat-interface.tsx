"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import ChatSidebar from "./chat-sidebar"
import ModelSelector from "./model-selector"

type Message = {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [showGreeting, setShowGreeting] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Check if mobile on mount
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setSidebarOpen(false)
      }
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputValue])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Hide greeting on first message
    if (showGreeting) {
      setShowGreeting(false)
    }

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Simulate bot response after a delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm a mock response from the AI assistant. This is a placeholder that would be replaced with actual AI-generated content in a production environment.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, botMessage])
    }, 1000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="fixed inset-0 bg-white flex flex-col md:flex-row z-50 transition-all duration-500 ease-in-out">
      {/* Sidebar */}
      <ChatSidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={() => setSidebarOpen(true)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </Button>
            <h1 className="text-xl font-medium">Genie</h1>
          </div>
          <ModelSelector />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4">
          {showGreeting ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-blue-400 to-blue-300 blur-sm animate-pulse-subtle animate-color-shift mb-8"></div>
              <h2 className="text-2xl text-center mb-4">How can I help you today?</h2>
              <p className="text-gray-500 text-center max-w-md mb-8">
                Ask me anything, from creative writing to research questions.
              </p>
              <div className="w-full max-w-md">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-medium mb-2">Example prompts</h3>
                  <ul className="space-y-2">
                    <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Write a poem about the ocean</li>
                    <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">Help me plan a trip to Japan</li>
                    <li className="p-2 hover:bg-gray-100 rounded cursor-pointer">
                      Explain quantum computing to a 10-year-old
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.role === "user"
                        ? "bg-black text-white rounded-tr-none"
                        : "bg-gray-100 text-black rounded-tl-none"
                    }`}
                  >
                    <p>{message.content}</p>
                    <div className={`text-xs mt-1 ${message.role === "user" ? "text-gray-300" : "text-gray-500"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t p-4">
          <div className="flex items-center bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
            <button className="text-gray-400 hover:text-gray-600 mr-2">
              <Paperclip className="w-5 h-5" />
            </button>
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Genie..."
              className="flex-1 outline-none resize-none max-h-32 py-2"
              rows={1}
            />
            <button
              className={`ml-2 p-2 rounded-full ${
                inputValue.trim() ? "bg-black text-white" : "bg-gray-100 text-gray-400"
              }`}
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
