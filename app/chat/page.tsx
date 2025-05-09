"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Send,
  Clipboard,
  ExternalLink,
  Trash,
  Plus,
  Search,
  Clock,
  Pin,
  User,
  CheckIcon,
  Menu,
  ChevronLeft,
  ChevronRight,
  Paperclip,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { chatService, Message as ChatServiceMessage } from "@/lib/services/chatService";
import { chatStore, Message as BaseMessage, ChatHistory } from "@/lib/services/chatStore";

// Import Navigation component
const Navbar = dynamic(() => import("@/components/navbar"), {
  ssr: false,
});

// Import Footer component
const Footer = dynamic(() => import("@/components/footer"), {
  ssr: false,
});

// Import the GradientSphere component
const GradientSphere = dynamic(() => import("@/components/gradient-sphere"), {
  ssr: false,
});

type Message = BaseMessage & {
  tokens?: number;
  speed?: string;
};

export default function ChatPage() {
  // You can replace this with actual auth later
  const userId = "anonymous-user";

  // State management
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeChat, setActiveChat] = useState<number | null>(null); // For hover state
  const [isLoadingChats, setIsLoadingChats] = useState(true); // Add loading state for chats
  const [generatingText, setGeneratingText] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]); // For storing all messages including user messages

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial data
  useEffect(() => {
    setMounted(true);

    // Load chat history from Supabase on component mount
    const loadChatHistory = async () => {
      try {
        setIsLoadingChats(true);
        const history = await chatStore.getChatHistory(userId);
        setChatHistory(history);
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChatHistory();
  }, [userId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, allMessages]);

  // Event handlers
  const handleSend = async () => {
    if ((!input.trim() && !uploadedFile) || isLoading) return;

    try {
      setIsLoading(true);
      const userMessage: Message = {
        role: "user",
        // Include file information in the message content for proper display
        content: uploadedFile
          ? input.trim()
            ? `${input}\n\nFile: ${uploadedFile.name}`
            : `File: ${uploadedFile.name}`
          : input,
        timestamp: new Date(),
      };
      
      // Clear input immediately
      setInput("");
      
      // Store the user message in our separate state
      setAllMessages(prev => [...prev, userMessage]);
      
      // Add user message to chat and placeholder for AI
      setMessages((prev) => [
        ...prev, 
        userMessage,
        {
          role: "assistant",
          content: "...",
          timestamp: new Date()
        }
      ]);

      // Clear initial message state
      if (showInitialMessage) {
        setShowInitialMessage(false);
      }

      // Reset uploaded file
      setUploadedFile(null);
      setUploadedFileContent(null);

      // Start generating animation
      setGeneratingText(true);

      // Get response from chat service
      const model = "llama3-70b-8192"; // Default to a powerful model
      const response = await chatService.sendMessage([...messages, userMessage], model);

      // Simulate typewriter effect for gradual text printing
      // Start with empty response content
      setMessages((prev) => {
        const messagesCopy = [...prev];
        // Replace the last message (which should be our placeholder)
        messagesCopy[messagesCopy.length - 1] = {
          role: "assistant",
          content: "", // Start with empty content that will be gradually filled
          timestamp: new Date(),
          speed: "2.3x FASTER",
          tokens: Math.floor(response.length / 4), // Rough token estimate
        };
        return messagesCopy;
      });

      // Gradually add characters to create typing effect
      const responseChars = response.split("");
      let currentText = "";
      const typingSpeed = 5; // Adjust typing speed (lower = faster)
      
      for (let i = 0; i < responseChars.length; i++) {
        await new Promise(resolve => setTimeout(resolve, typingSpeed));
        currentText += responseChars[i];
        
        setMessages((prev) => {
          const messagesCopy = [...prev];
          messagesCopy[messagesCopy.length - 1] = {
            ...messagesCopy[messagesCopy.length - 1],
            content: currentText,
          };
          return messagesCopy;
        });
        
        // Scroll to bottom as text appears
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }

      // Add the completed AI response to our all messages array
      setAllMessages(prev => [...prev, {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        speed: "2.3x FASTER",
        tokens: Math.floor(response.length / 4), // Rough token estimate
      }]);

      // Save the chat after the message exchange
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        speed: "2.3x FASTER",
        tokens: Math.floor(response.length / 4),
      };
      
      // Use allMessages for storage since it has all user and AI messages
      const updatedMessages: Message[] = [...allMessages, userMessage, assistantMessage];

      if (currentChatId === null) {
        // New chat
        const title = chatStore.generateChatTitle(updatedMessages);
        const newChat: ChatHistory = {
          id: Date.now(), // Temporary ID, will be replaced by Supabase
          title: title,
          date: new Date().toLocaleDateString(),
          messages: updatedMessages,
          user_id: userId,
        };

        const savedChat = await chatStore.saveChat(newChat);
        if (savedChat) {
          setCurrentChatId(savedChat.id);
        }
      } else {
        // Update existing chat
        await chatStore.updateChat(currentChatId, {
          messages: updatedMessages,
        });
      }

      // Refresh chat history
      const history = await chatStore.getChatHistory(userId);
      setChatHistory(history);
      setGeneratingText(false);
    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessages((prev) => {
        const messagesCopy = [...prev];
        // Replace the last message (which should be our placeholder)
        messagesCopy[messagesCopy.length - 1] = {
          role: "assistant",
          content: "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        return messagesCopy;
      });
      
      // Add the error message to allMessages too
      setAllMessages(prev => [...prev, {
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      }]);
      
      setGeneratingText(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const fileContent = await file.text();
      setUploadedFileContent(fileContent);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleLoadChat = async (chatId: number) => {
    // Get the specific chat from history
    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setAllMessages(chat.messages);
      // Only display the messages in the UI based on our display logic
      const displayMessages = [];
      for (let i = 0; i < chat.messages.length; i++) {
        displayMessages.push(chat.messages[i]);
      }
      setMessages(displayMessages);
      setCurrentChatId(chat.id);
      setShowInitialMessage(false);
      if (window.innerWidth < 768) {
        setSidebarOpen(false); // Close sidebar on mobile after selection
      }
    }
  };

  const handleDeleteChat = async (chatId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    await chatStore.deleteChat(chatId);
    const updatedHistory = await chatStore.getChatHistory(userId);
    setChatHistory(updatedHistory);

    if (currentChatId === chatId) {
      setMessages([]);
      setAllMessages([]);
      setShowInitialMessage(true);
      setCurrentChatId(null);
    }
  };

  const handlePinChat = async (chatId: number, currentPinned: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    await chatStore.pinChat(chatId, currentPinned);
    const updatedHistory = await chatStore.getChatHistory(userId);
    setChatHistory(updatedHistory);
  };

  const handleNewChat = () => {
    setMessages([]);
    setAllMessages([]);
    setShowInitialMessage(true);
    setCurrentChatId(null);
    if (window.innerWidth < 768) {
      setSidebarOpen(false); // Close sidebar on mobile
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Filter and sort chat history
  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Header - Using the Navbar component */}
      <Navbar currentPage="chat" />

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed z-30 top-20 left-4 md:hidden bg-white/80 p-2 rounded-md border border-gray-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Sidebar - Chat History */}
      <div
        className={`fixed left-0 top-0 bottom-0 w-64 bg-white/80 backdrop-blur-sm z-20 border-r border-gray-100 pt-16 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          boxShadow: sidebarOpen ? "0 0 15px rgba(0, 0, 0, 0.05)" : "none",
        }}
      >
        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-3 text-sm flex items-center gap-2 border border-gray-200 rounded-full hover:border-gray-300 transition-colors bg-white/90"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 border border-gray-200 rounded-full py-2 pl-8 pr-2 text-sm focus:outline-none focus:border-indigo-300 transition-colors"
            />
          </div>
        </div>

        <div className="px-4 overflow-y-auto h-[calc(100vh-400px)]">
          {isLoadingChats ? (
            <div className="flex justify-center py-8">
              <div className="gentle-loading">
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
                <div className="loading-dot"></div>
              </div>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((chat) => (
                <div
                  key={chat.id}
                  className="relative group"
                  onMouseEnter={() => setActiveChat(chat.id)}
                  onMouseLeave={() => setActiveChat(null)}
                >
                  <button
                    className={`w-full text-left py-2 px-3 text-sm hover:bg-gray-100/60 flex items-center gap-2 transition-colors rounded-md ${
                      currentChatId === chat.id
                        ? "bg-gray-100/80 border-l-2 border-indigo-400"
                        : ""
                    }`}
                    onClick={() => handleLoadChat(chat.id)}
                  >
                    {chat.pinned ? (
                      <Pin className="w-3 h-3 text-indigo-500" />
                    ) : (
                      <Clock className="w-3 h-3 text-gray-400" />
                    )}
                    <div className="flex-1 truncate pr-4">
                      <div className="text-gray-700 truncate">{chat.title}</div>
                      <div className="text-xs text-gray-400">{chat.date}</div>
                    </div>
                  </button>

                  {/* Action buttons - visible only on hover or for active chat */}
                  <div
                    className={`absolute right-0 top-0 bottom-0 flex items-center mr-1 transition-opacity duration-200 ${
                      activeChat === chat.id || currentChatId === chat.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <button
                      onClick={(e) => handlePinChat(chat.id, !!chat.pinned, e)}
                      className="p-1 text-gray-400 hover:text-gray-700"
                      title={chat.pinned ? "Unpin chat" : "Pin chat"}
                    >
                      <Pin
                        className={`w-3 h-3 ${
                          chat.pinned ? "text-indigo-400" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 text-gray-400 hover:text-red-500"
                      title="Delete chat"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Toggle Button - Integrated into sidebar border */}
      <button
        onClick={toggleSidebar}
        className={`fixed z-30 transition-all duration-300 ${
          sidebarOpen
            ? "left-64 top-1/2 -translate-y-1/2 h-16 w-6 rounded-r-md"
            : "left-0 top-1/2 -translate-y-1/2 h-16 w-6 rounded-r-md"
        } hidden md:flex items-center justify-center bg-white/70 border-r border-t border-b border-gray-200 backdrop-blur-sm`}
        style={{
          borderLeft: sidebarOpen
            ? "none"
            : "1px solid rgba(229, 231, 235, 1)",
        }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Dark overlay when sidebar is open on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-10 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content - Adjust padding to accommodate sidebar */}
      <div
        className={`relative z-10 pt-16 min-h-screen ${
          sidebarOpen ? "md:pl-64" : "md:pl-0"
        } transition-all duration-300`}
      >
        {/* Welcome Visualization State (before first message) */}
        {showInitialMessage && (
          <div 
            className="fixed inset-0 flex flex-col items-center justify-center z-10"
            style={{
              // This adjusts the positioning when sidebar is open/closed
              left: sidebarOpen ? "256px" : 0,
              width: sidebarOpen ? "calc(100% - 256px)" : "100%",
              top: "64px", // Account for navbar height
              height: "calc(100% - 64px)"
            }}
          >
            {/* Gradient Sphere with Simple, Elegant Text Overlay */}
            <div className="relative w-full max-w-xl mx-auto">
              {/* The Gradient Sphere */}
              <div className="w-full" style={{ maxHeight: "70vh" }}>
                <GradientSphere />
              </div>
              
              {/* Single elegant text positioned on top of the sphere */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <h2 
                  className="text-3xl md:text-4xl lg:text-5xl font-light text-center text-gray-800"
                  style={{ 
                    position: 'relative', 
                    zIndex: 20,
                    textShadow: '0 2px 10px rgba(255,255,255,0.7)'
                  }}
                >
                  Hi, I'm Genie.
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface (after first message or always visible but transparent initially) */}
        <AnimatePresence>
          {(!showInitialMessage || messages.length > 0) && (
            <motion.div
              className={`absolute inset-0 flex flex-col pt-16 ${
                sidebarOpen ? "md:pl-64" : "md:pl-0"
              } transition-all duration-300`}
              initial={{ opacity: messages.length > 0 ? 1 : 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {/* Chat Messages Container */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-4 py-4 pb-28 scrollbar-none bg-chat-pattern"
              >
                <div className="max-w-3xl mx-auto">
                  <AnimatePresence>
                    {messages.map((message, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className={`mb-6 ${
                          message.role === "user" ? "ml-auto" : "ml-0"
                        }`}
                        style={{ maxWidth: "95%" }}
                      >
                        {message.role === "user" ? (
                          /* User message - right aligned with user avatar */
                          <div className="flex items-start gap-3 justify-end ml-auto">
                            <div className="bg-indigo-100 p-3 rounded-lg break-words text-gray-800 shadow-sm">
                              {message.content}
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden bg-gradient-to-r from-purple-100 to-indigo-100">
                              <User className="w-4 h-4 text-gray-700" />
                            </div>
                          </div>
                        ) : (
                          /* Assistant message - left aligned with bot avatar, no message box */
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden bg-gradient-to-r from-indigo-100 to-purple-100">
                              <span className="text-lg">✿</span>
                            </div>

                            {message.content === "..." ? (
                              /* Elegant minimal loading animation */
                              <div className="mt-2 elegant-loading">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                              </div>
                            ) : generatingText && index === messages.length - 1 ? (
                              /* Enhanced generating animation for the last message when in typing mode */
                              <div className="flex-1 text-gray-800">
                                <div className="mb-1 flex items-center text-xs text-indigo-400 font-light">
                                  <span className="generating-badge">
                                    <span className="pulse"></span>
                                    <span className="ml-1">generating...</span>
                                  </span>
                                </div>
                                <div className="markdown-content">
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ node, ...props }) => (
                                        <h1
                                          className="text-xl font-bold my-3"
                                          {...props}
                                        />
                                      ),
                                      h2: ({ node, ...props }) => (
                                        <h2
                                          className="text-lg font-bold my-2"
                                          {...props}
                                        />
                                      ),
                                      h3: ({ node, ...props }) => (
                                        <h3
                                          className="text-md font-semibold my-2"
                                          {...props}
                                        />
                                      ),
                                      p: ({ node, ...props }) => (
                                        <p className="mb-3" {...props} />
                                      ),
                                      ul: ({ node, ...props }) => (
                                        <ul
                                          className="list-disc pl-5 mb-3"
                                          {...props}
                                        />
                                      ),
                                      ol: ({ node, ...props }) => (
                                        <ol
                                          className="list-decimal pl-5 mb-3"
                                          {...props}
                                        />
                                      ),
                                      li: ({ node, ...props }) => (
                                        <li className="mb-1" {...props} />
                                      ),
                                      a: ({ node, ...props }) => (
                                        <a
                                          className="text-indigo-600 hover:underline flex items-center"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          {...props}
                                        >
                                          {props.children}
                                          <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                      ),
                                      strong: ({ node, ...props }) => (
                                        <strong
                                          className="font-bold"
                                          {...props}
                                        />
                                      ),
                                      em: ({ node, ...props }) => (
                                        <em className="italic" {...props} />
                                      ),
                                      blockquote: ({ node, ...props }) => (
                                        <blockquote
                                          className="border-l-4 border-indigo-300 pl-4 italic my-3 text-gray-600"
                                          {...props}
                                        />
                                      ),
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                                {/* Blinking cursor at the end */}
                                <div className="typing-cursor"></div>
                              </div>
                            ) : (
                              /* Standard AI message - directly on canvas, no box */
                              <div className="flex-1">
                                {/* Performance metrics - show token count */}
                                {message.tokens && (
                                  <div className="flex items-center text-xs text-gray-400 mb-1">
                                    <span className="flex items-center opacity-50">
                                      {message.tokens} tokens
                                    </span>
                                  </div>
                                )}

                                {/* Message content directly on canvas */}
                                <div className="text-gray-800 overflow-wrap-anywhere markdown-content">
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ node, ...props }) => (
                                        <h1
                                          className="text-xl font-bold my-3"
                                          {...props}
                                        />
                                      ),
                                      h2: ({ node, ...props }) => (
                                        <h2
                                          className="text-lg font-bold my-2"
                                          {...props}
                                        />
                                      ),
                                      h3: ({ node, ...props }) => (
                                        <h3
                                          className="text-md font-semibold my-2"
                                          {...props}
                                        />
                                      ),
                                      p: ({ node, ...props }) => (
                                        <p className="mb-3" {...props} />
                                      ),
                                      ul: ({ node, ...props }) => (
                                        <ul
                                          className="list-disc pl-5 mb-3"
                                          {...props}
                                        />
                                      ),
                                      ol: ({ node, ...props }) => (
                                        <ol
                                          className="list-decimal pl-5 mb-3"
                                          {...props}
                                        />
                                      ),
                                      li: ({ node, ...props }) => (
                                        <li className="mb-1" {...props} />
                                      ),
                                      a: ({ node, ...props }) => (
                                        <a
                                          className="text-indigo-600 hover:underline flex items-center"
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          {...props}
                                        >
                                          {props.children}
                                          <ExternalLink className="w-3 h-3 ml-1" />
                                        </a>
                                      ),
                                      strong: ({ node, ...props }) => (
                                        <strong
                                          className="font-bold"
                                          {...props}
                                        />
                                      ),
                                      em: ({ node, ...props }) => (
                                        <em className="italic" {...props} />
                                      ),
                                      blockquote: ({ node, ...props }) => (
                                        <blockquote
                                          className="border-l-4 border-indigo-300 pl-4 italic my-3 text-gray-600"
                                          {...props}
                                        />
                                      ),
                                      // Add styling for code blocks
                                      code: ({ node, inline, className, children, ...props }: any) => {
                                        return inline ? (
                                          <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600 text-sm" {...props}>
                                            {children}
                                          </code>
                                        ) : (
                                          <div className="bg-gray-50 rounded-md p-4 my-3 overflow-x-auto border border-gray-100">
                                            <code className="text-sm font-mono text-gray-800" {...props}>
                                              {children}
                                            </code>
                                          </div>
                                        );
                                      },
                                      pre: ({ node, ...props }) => (
                                        <pre className="bg-transparent p-0 overflow-visible" {...props} />
                                      ),
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>

                                {/* Action buttons */}
                                <div className="flex space-x-2 mt-1">
                                  <button
                                    className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded-full transition-colors flex items-center bg-white/80"
                                    onClick={() =>
                                      handleCopyText(message.content)
                                    }
                                  >
                                    {copied ? (
                                      <>
                                        <CheckIcon className="w-3 h-3 text-green-500 mr-1" />
                                        <span className="text-green-500">
                                          Copied
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <Clipboard className="w-3 h-3 mr-1" />
                                        Copy
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Thinking indicator that appears when generating */}
                  {generatingText && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-start gap-3 mb-6"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden bg-gradient-to-r from-indigo-100 to-purple-100">
                        <span className="text-lg">✿</span>
                      </div>
                      <div className="elegant-generating">
                        <span className="pulse-ring"></span>
                        <span className="ml-2 text-sm text-gray-500 font-light">Thinking...</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area - Always at bottom */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/80 backdrop-blur-sm ${
            sidebarOpen ? "md:pl-64" : "md:pl-0"
          } transition-all duration-300`}
        >
          <div className="max-w-4xl mx-auto relative">
            {/* Uploaded file display */}
            {uploadedFile && (
              <div className="px-6 pt-2 pb-0">
                <div className="flex items-center gap-2 p-2 border border-gray-200 rounded-md bg-white/60 text-gray-800 text-sm relative overflow-hidden">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden bg-gradient-to-r from-indigo-100 to-purple-100">
                    <Paperclip className="w-3 h-3 text-gray-700" />
                  </div>

                  <div className="flex-1 truncate">
                    <div className="font-medium truncate">
                      {uploadedFile.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {uploadedFile.size
                        ? `${Math.round(uploadedFile.size / 1024)} KB`
                        : "File uploaded"}
                    </div>
                  </div>

                  <button
                    onClick={() => setUploadedFile(null)}
                    className="text-gray-500 hover:text-gray-700 w-6 h-6 rounded-full flex items-center justify-center border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Text Input Area */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message Genie..."
                className="w-full bg-transparent px-6 py-4 pr-24 focus:outline-none placeholder-gray-400 text-gray-800 border-b border-gray-100"
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />

              {/* Purple gradient effect when typing */}
              {input && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[1px]"
                  style={{
                    background:
                      "linear-gradient(to right, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.6), rgba(99, 102, 241, 0.2))",
                  }}
                ></div>
              )}

              {/* Action buttons - aligned in a row */}
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                {/* File upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={isLoading || (!input.trim() && !uploadedFile)}
                  className={`${
                    !isLoading && (input.trim() || uploadedFile)
                      ? "text-indigo-500 hover:text-indigo-600"
                      : "text-gray-300"
                  } transition-colors`}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-t-transparent border-indigo-400 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>

            {/* Footer control bar */}
            <div className="px-6 py-2.5 flex justify-between items-center border-t border-gray-100 text-xs text-gray-400">
              <div className="flex items-center space-x-8">
                <span className="flex items-center">
                  <span className="opacity-70 mr-1">Press</span>
                  <span className="bg-gray-100 px-1 rounded">Enter</span>
                  <span className="ml-2">TO SEND</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer component */}
      <Footer />

      {/* CSS for loading animation and other styles */}
      <style jsx global>{`
        /* New elegant loading animation */
        .elegant-loading {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          height: 20px;
        }
        
        .elegant-loading .dot {
          width: 4px;
          height: 4px;
          margin: 0 2px;
          background-color: rgba(99, 102, 241, 0.5);
          border-radius: 50%;
          animation: elegantPulse 1.4s infinite ease-in-out;
        }
        
        .elegant-loading .dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .elegant-loading .dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes elegantPulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.3;
          }
          40% {
            transform: scale(1);
            opacity: 0.8;
          }
        }

        /* Generating indicator */
        .generating-badge {
          display: flex;
          align-items: center;
          font-size: 10px;
          background-color: rgba(99, 102, 241, 0.08);
          padding: 2px 6px;
          border-radius: 10px;
        }
        
        .pulse {
          width: 6px;
          height: 6px;
          background-color: rgba(99, 102, 241, 0.6);
          border-radius: 50%;
          animation: pulse 1.5s infinite ease-in-out;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
        }

        /* Typing cursor effect */
        .typing-cursor {
          display: inline-block;
          width: 2px;
          height: 16px;
          background-color: rgba(99, 102, 241, 0.8);
          margin-left: 2px;
          animation: blink 0.8s infinite;
        }
        
        @keyframes blink {
          0%, 100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        
        /* More elegant generating indicator with pulse ring */
        .elegant-generating {
          display: flex;
          align-items: center;
        }
        
        .pulse-ring {
          display: inline-block;
          width: 8px;
          height: 8px;
          background-color: rgba(99, 102, 241, 0.6);
          border-radius: 50%;
          position: relative;
        }
        
        .pulse-ring:before {
          content: '';
          position: absolute;
          left: -4px;
          top: -4px;
          right: -4px;
          bottom: -4px;
          border-radius: 50%;
          border: 2px solid rgba(99, 102, 241, 0.3);
          animation: pulse-ring 1.5s infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          70% {
            transform: scale(1.2);
            opacity: 0;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }

        /* Original gentle loading animation for comparison */
        .gentle-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 8px 0;
        }

        .loading-dot {
          width: 8px;
          height: 8px;
          background-color: rgba(79, 70, 229, 0.6);
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .loading-dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.6;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }

        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .overflow-wrap-anywhere {
          overflow-wrap: anywhere;
          word-break: break-word;
        }

        /* Subtle background pattern */
        .bg-chat-pattern {
          background-image: radial-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Ensure code blocks look elegant */
        pre {
          white-space: pre-wrap;
          word-break: break-word;
          background-color: transparent;
          padding: 0;
          margin: 0;
        }

        /* Markdown content spacing improvements */
        .markdown-content {
          line-height: 1.6;
        }
        
        .markdown-content p {
          margin-bottom: 0.8em;
        }

        .markdown-content h1, 
        .markdown-content h2, 
        .markdown-content h3 {
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          font-weight: 500;
        }
      `}</style>
    </main>
  );
}