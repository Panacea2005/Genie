"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
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
  EyeOff,
  Mic,
  MicOff,
  ChevronUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  chatService,
  Message as ChatServiceMessage,
} from "@/lib/services/chatService";
import {
  chatStore,
  Message as BaseMessage,
  ChatHistory,
} from "@/lib/services/chatStore";

// Chat specific imports
import ModelSelector from "@/components/chat/model-selector";
import VoiceSelector from "@/components/chat/voice-selector";
import ModeSelector from "@/components/chat/mode-selector";
import SpeechMode from "@/components/chat/speech-mode";
import Groq from "groq-sdk";
import { getTTSService } from "@/lib/services/ttsService";

// Import Navigation component
const Navbar = dynamic(() => import("@/components/navbar"), {
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
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  // State management for chat functionality
  const [mounted, setMounted] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<number | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInitialMessage, setShowInitialMessage] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileContent, setUploadedFileContent] = useState<string | null>(
    null
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toolsBarExpanded, setToolsBarExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speakingMessageIndex, setSpeakingMessageIndex] = useState<
    number | null
  >(null);
  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(null);
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [generatingText, setGeneratingText] = useState(false);
  const [allMessages, setAllMessages] = useState<Message[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingAudio, setProcessingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Chat state
  const [showPrivacyMode, setShowPrivacyMode] = useState(false);
  const [selectedModel, setSelectedModel] = useState("llama3-70b-8192");
  const [chatMode, setChatMode] = useState<"chat" | "speech">("chat");

  // Refs
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ttsServiceRef = useRef(getTTSService());

  // Load initial data - only when user is available
  useEffect(() => {
    if (!user) return;

    setMounted(true);

    // Load saved voice preference
    const savedVoiceName = localStorage.getItem("preferredVoice");
    if (savedVoiceName && "speechSynthesis" in window) {
      const loadSavedVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        const savedVoice = voices.find((v) => v.name === savedVoiceName);
        if (savedVoice) {
          setSelectedVoice(savedVoice);
        }
      };

      // Try loading immediately
      loadSavedVoice();

      // Also listen for voices changed event
      window.speechSynthesis.onvoiceschanged = loadSavedVoice;
    }

    // Load chat history from Supabase on component mount
    const loadChatHistory = async () => {
      try {
        setIsLoadingChats(true);
        const history = await chatStore.getChatHistory(user.id);
        setChatHistory(history);
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChatHistory();
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, allMessages]);

  // Second useEffect for tools bar - also check for user
  useEffect(() => {
    if (!user) return;

    setMounted(true);

    // Load tools bar state from localStorage
    const toolsBarExpanded = localStorage.getItem("toolsBarExpanded");
    if (toolsBarExpanded !== null) {
      setToolsBarExpanded(toolsBarExpanded === "true");
    }

    // Load chat history from Supabase on component mount
    const loadChatHistory = async () => {
      try {
        setIsLoadingChats(true);
        const history = await chatStore.getChatHistory(user.id);
        setChatHistory(history);
      } catch (error) {
        console.error("Error loading chat history:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChatHistory();
  }, [user]);

  // Handler for tools bar toggle
  const handleToolsBarToggle = (
    expanded: boolean | ((prevState: boolean) => boolean)
  ) => {
    setToolsBarExpanded(expanded);
    localStorage.setItem("toolsBarExpanded", expanded.toString());
  };

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setRecordingTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleAudioStop;

      mediaRecorder.start();
      setIsRecording(true);

      // Start a timer to track recording duration
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1);
      }, 1000);

      console.log("Recording started...");
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();

      // Stop all tracks on the stream to release the microphone
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());

      // Clear the timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }

      setIsRecording(false);
      setProcessingAudio(true);
    }
  };

  const processAudio = async (base64Audio: string) => {
    try {
      console.log("Processing audio...");
      setProcessingAudio(true);

      let transcribedText = "";

      try {
        const groq = new Groq({
          apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
          dangerouslyAllowBrowser: true,
        });

        const binaryData = atob(base64Audio);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "audio/webm" });
        const file = new File([blob], "recording.webm", { type: "audio/webm" });

        const response = await groq.audio.transcriptions.create({
          model: "whisper-large-v3-turbo",
          file: file,
          language: "en",
        });

        transcribedText = response.text;
        console.log("Transcription successful:", transcribedText);
      } catch (apiError) {
        console.error("Direct API call failed:", apiError);

        try {
          const response = await fetch("/api/transcribe", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              audio: base64Audio,
              model: "whisper-large-v3-turbo",
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Backend API error: ${response.status} ${response.statusText}`
            );
          }

          const data = await response.json();
          transcribedText = data.text || "";
          console.log("Backend transcription successful:", transcribedText);
        } catch (backendError) {
          console.error("Backend API call failed:", backendError);
          transcribedText =
            "I couldn't transcribe your audio. Please try typing your message.";
        }
      }

      if (!transcribedText.trim()) {
        console.warn("Empty transcription result");
        transcribedText =
          "I couldn't capture your voice clearly. Please try again or type your message.";
      }

      setInput((prev) => {
        const trimmedPrev = prev.trim();
        const newText = trimmedPrev
          ? `${trimmedPrev} ${transcribedText}`
          : transcribedText;
        console.log("Setting input to:", newText);
        return newText;
      });

      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error("Error in processAudio:", error);
      setInput((prev) => {
        return prev + " [Voice transcription failed]";
      });
    } finally {
      setProcessingAudio(false);
    }
  };

  const handleAudioStop = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64String = reader.result?.toString() || "";
        const base64Audio = base64String.split(",")[1];

        if (base64Audio) {
          await processAudio(base64Audio);
        } else {
          console.error("Failed to convert audio to base64");
          setInput((prev) => prev + " [Audio conversion failed]");
        }
      };
    } catch (error) {
      console.error("Error processing recording:", error);
      setInput((prev) => prev + " [Recording processing failed]");
    } finally {
      setProcessingAudio(false);
    }
  };

  // Cleanup function to ensure resources are released
  useEffect(() => {
    return () => {
      // Clean up on component unmount
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      // Clean up TTS
      const tts = ttsServiceRef.current;
      if (tts && tts.isSpeaking()) {
        tts.stop();
      }
    };
  }, []);

  // Function to format the recording time
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
      setAllMessages((prev) => [...prev, userMessage]);

      // Add user message to chat and placeholder for AI
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          role: "assistant",
          content: "...",
          timestamp: new Date(),
        },
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
      const model = selectedModel;
      const response = await chatService.sendMessage(
        [...messages, userMessage],
        model
      );

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
        await new Promise((resolve) => setTimeout(resolve, typingSpeed));
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
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      }

      // Add the completed AI response to our all messages array
      setAllMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response,
          timestamp: new Date(),
          speed: "2.3x FASTER",
          tokens: Math.floor(response.length / 4), // Rough token estimate
        },
      ]);

      // Save the chat after the message exchange
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date(),
        speed: "2.3x FASTER",
        tokens: Math.floor(response.length / 4),
      };

      // Use allMessages for storage since it has all user and AI messages
      const updatedMessages: Message[] = [
        ...allMessages,
        userMessage,
        assistantMessage,
      ];

      if (currentChatId === null) {
        // New chat
        const title = chatStore.generateChatTitle(updatedMessages);
        const newChat: ChatHistory = {
          id: Date.now(), // Temporary ID, will be replaced by Supabase
          title: title,
          date: new Date().toLocaleDateString(),
          messages: updatedMessages,
          user_id: String(user?.id || 0), // Ensure user_id is always a string
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
      const history = user ? await chatStore.getChatHistory(user.id) : [];
      setChatHistory(history);
      setGeneratingText(false);
    } catch (error) {
      console.error("Error in handleSend:", error);
      setMessages((prev) => {
        const messagesCopy = [...prev];
        // Replace the last message (which should be our placeholder)
        messagesCopy[messagesCopy.length - 1] = {
          role: "assistant",
          content:
            "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
        return messagesCopy;
      });

      // Add the error message to allMessages too
      setAllMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        },
      ]);

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

  const handleSpeakText = (text: string, messageIndex: number) => {
    const tts = ttsServiceRef.current;
    if (!tts) {
      console.warn("Text-to-speech not available");
      return;
    }

    // If already speaking this message, stop it
    if (speakingMessageIndex === messageIndex && tts.isSpeaking()) {
      tts.stop();
      setSpeakingMessageIndex(null);
      return;
    }

    // Stop any other speech
    if (tts.isSpeaking()) {
      tts.stop();
    }

    // Prepare text for speech (remove markdown)
    const cleanText = tts.prepareTextForSpeech(text);

    // Start speaking
    setSpeakingMessageIndex(messageIndex);
    tts.speak(cleanText, {
      voice: selectedVoice ?? undefined,
      onEnd: () => {
        setSpeakingMessageIndex(null);
      },
      onError: (error) => {
        console.error("TTS error:", error);
        setSpeakingMessageIndex(null);
      },
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
    const updatedHistory = user ? await chatStore.getChatHistory(user.id) : [];
    setChatHistory(updatedHistory);

    if (currentChatId === chatId) {
      setMessages([]);
      setAllMessages([]);
      setShowInitialMessage(true);
      setCurrentChatId(null);
    }
  };

  const handlePinChat = async (
    chatId: number,
    currentPinned: boolean,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent triggering the chat selection
    await chatStore.pinChat(chatId, currentPinned);
    const updatedHistory = user ? await chatStore.getChatHistory(user.id) : [];
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
          borderLeft: sidebarOpen ? "none" : "1px solid rgba(229, 231, 235, 1)",
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
        {/* Sidebar-aware Model Selector positioning */}
        <div
          className={`absolute top-0 z-40 p-4 transition-all duration-300 ${
            sidebarOpen ? "left-64" : "left-0"
          }`}
        >
          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            position="left"
          />
        </div>

        {/* Mode Selector - Top Right */}
        <div className="absolute top-0 right-0 z-40 p-4">
          <ModeSelector selectedMode={chatMode} onModeChange={setChatMode} />
        </div>

        {/* Speech Mode Overlay */}
        <AnimatePresence>
          {chatMode === "speech" && (
            <SpeechMode
              selectedModel={selectedModel}
              selectedVoice={selectedVoice}
              onClose={() => setChatMode("chat")}
            />
          )}
        </AnimatePresence>

        {/* Welcome Visualization State (before first message) */}
        {showInitialMessage && (
          <div
            className="fixed inset-0 flex flex-col items-center justify-center z-10"
            style={{
              // This adjusts the positioning when sidebar is open/closed
              left: sidebarOpen ? "256px" : 0,
              width: sidebarOpen ? "calc(100% - 256px)" : "100%",
              top: "64px", // Account for navbar height
              height: "calc(100% - 64px)",
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
                    position: "relative",
                    zIndex: 20,
                    textShadow: "0 2px 10px rgba(255,255,255,0.7)",
                  }}
                >
                  Hi, I'm Genie.
                </h2>
              </div>
            </div>
          </div>
        )}

        {/* Chat Interface - Only visible in chat mode */}
        {chatMode === "chat" && (
          <>
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
                            } ${
                              speakingMessageIndex === index
                                ? "speaking-indicator"
                                : ""
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
                                ) : generatingText &&
                                  index === messages.length - 1 ? (
                                  /* Enhanced generating animation for the last message when in typing mode */
                                  <div className="flex-1 text-gray-800">
                                    <div className="mb-1 flex items-center text-xs text-indigo-400 font-light">
                                      <span className="generating-badge">
                                        <span className="pulse"></span>
                                        <span className="ml-1">
                                          generating...
                                        </span>
                                      </span>
                                    </div>
                                    <div
                                      className={`markdown-content ${
                                        showPrivacyMode ? "privacy-blur" : ""
                                      }`}
                                    >
                                      {showPrivacyMode ? (
                                        <div
                                          onClick={() =>
                                            setShowPrivacyMode(false)
                                          }
                                          className="p-3 cursor-pointer text-center"
                                        >
                                          Content hidden for privacy. Click to
                                          view.
                                        </div>
                                      ) : (
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
                                              <em
                                                className="italic"
                                                {...props}
                                              />
                                            ),
                                            blockquote: ({
                                              node,
                                              ...props
                                            }) => (
                                              <blockquote
                                                className="border-l-4 border-indigo-300 pl-4 italic my-3 text-gray-600"
                                                {...props}
                                              />
                                            ),
                                          }}
                                        >
                                          {message.content}
                                        </ReactMarkdown>
                                      )}
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
                                    <div
                                      className={`text-gray-800 overflow-wrap-anywhere markdown-content ${
                                        showPrivacyMode ? "privacy-blur" : ""
                                      }`}
                                    >
                                      {showPrivacyMode ? (
                                        <div
                                          onClick={() =>
                                            setShowPrivacyMode(false)
                                          }
                                          className="p-3 cursor-pointer text-center"
                                        >
                                          Content hidden for privacy. Click to
                                          view.
                                        </div>
                                      ) : (
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
                                              <em
                                                className="italic"
                                                {...props}
                                              />
                                            ),
                                            blockquote: ({
                                              node,
                                              ...props
                                            }) => (
                                              <blockquote
                                                className="border-l-4 border-indigo-300 pl-4 italic my-3 text-gray-600"
                                                {...props}
                                              />
                                            ),
                                            // Add styling for code blocks
                                            code: ({
                                              node,
                                              inline,
                                              className,
                                              children,
                                              ...props
                                            }: any) => {
                                              return inline ? (
                                                <code
                                                  className="bg-gray-100 px-1 py-0.5 rounded text-indigo-600 text-sm"
                                                  {...props}
                                                >
                                                  {children}
                                                </code>
                                              ) : (
                                                <div className="bg-gray-50 rounded-md p-4 my-3 overflow-x-auto border border-gray-100">
                                                  <code
                                                    className="text-sm font-mono text-gray-800"
                                                    {...props}
                                                  >
                                                    {children}
                                                  </code>
                                                </div>
                                              );
                                            },
                                            pre: ({ node, ...props }) => (
                                              <pre
                                                className="bg-transparent p-0 overflow-visible"
                                                {...props}
                                              />
                                            ),
                                          }}
                                        >
                                          {message.content}
                                        </ReactMarkdown>
                                      )}
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

                                      <button
                                        className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-2 py-1 rounded-full transition-colors flex items-center bg-white/80"
                                        onClick={() =>
                                          handleSpeakText(
                                            message.content,
                                            index
                                          )
                                        }
                                      >
                                        {speakingMessageIndex === index ? (
                                          <>
                                            <VolumeX className="w-3 h-3 mr-1" />
                                            Stop
                                          </>
                                        ) : (
                                          <>
                                            <Volume2 className="w-3 h-3 mr-1" />
                                            Listen
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
                            <span className="ml-2 text-sm text-gray-500 font-light">
                              Thinking...
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Input Area - Always at bottom */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-20 border-t border-gray-200 bg-white/80 backdrop-blur-sm ${
            sidebarOpen ? "md:pl-64" : "md:pl-0"
          } transition-all duration-300`}
        >
          <div className="max-w-4xl mx-auto relative">
            {/* Simple Privacy Mode Toggle */}
            <div className="relative">
              {/* Privacy button - always visible */}
              <button
                onClick={() => setShowPrivacyMode(!showPrivacyMode)}
                className={`absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center z-10 hover:bg-gray-50 transition-colors ${
                  showPrivacyMode
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-label={
                  showPrivacyMode
                    ? "Disable privacy mode"
                    : "Enable privacy mode"
                }
                title={
                  showPrivacyMode ? "Privacy mode is on" : "Enable privacy mode"
                }
              >
                <EyeOff className="w-4 h-4" />
              </button>
            </div>

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
                className="w-full bg-transparent px-6 py-5 pr-24 focus:outline-none placeholder-gray-400 text-gray-800 border-b border-gray-100"
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

              {/* Action buttons - aligned on the right */}
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 flex items-center gap-3">
                {/* Voice input button with enhanced animations */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`${
                    isRecording
                      ? "text-red-500 recording-pulse"
                      : processingAudio
                      ? "text-indigo-400"
                      : "text-gray-400 hover:text-gray-600"
                  } transition-colors relative w-8 h-8 flex items-center justify-center`}
                  disabled={isLoading || (processingAudio && !isRecording)}
                  title={
                    isRecording
                      ? "Stop recording"
                      : processingAudio
                      ? "Processing voice..."
                      : "Voice input"
                  }
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span className="recording-timer">
                        {formatTime(recordingTime)}
                      </span>
                    </>
                  ) : processingAudio ? (
                    <div className="voice-processing">
                      <div className="voice-processing-bar"></div>
                      <div className="voice-processing-bar"></div>
                      <div className="voice-processing-bar"></div>
                      <div className="voice-processing-bar"></div>
                    </div>
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </button>

                {/* File upload button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading || isRecording}
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
                  disabled={
                    isLoading || (!input.trim() && !uploadedFile) || isRecording
                  }
                  className={`${
                    !isLoading && (input.trim() || uploadedFile) && !isRecording
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

              {/* Voice Selector */}
              <div className="flex items-center">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceSelect={setSelectedVoice}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isRecording && chatMode === "chat" && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-gray-200 flex items-center gap-3"
          >
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">
              Recording... {formatTime(recordingTime)}
            </span>
            <button
              onClick={stopRecording}
              className="ml-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <MicOff className="w-3 h-3 text-gray-600" />
            </button>
          </motion.div>
        )}

        {processingAudio && !isRecording && chatMode === "chat" && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md border border-gray-200 flex items-center gap-3"
          >
            <div className="voice-processing scale-75">
              <div className="voice-processing-bar"></div>
              <div className="voice-processing-bar"></div>
              <div className="voice-processing-bar"></div>
              <div className="voice-processing-bar"></div>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Processing voice...
            </span>
          </motion.div>
        )}
      </AnimatePresence>

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
          0%,
          80%,
          100% {
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
          0%,
          100% {
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
          content: "";
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
          0%,
          80%,
          100% {
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
          background-image: radial-gradient(
            rgba(99, 102, 241, 0.03) 1px,
            transparent 1px
          );
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

        /* Privacy mode blur effect */
        .privacy-blur {
          filter: blur(5px);
          user-select: none;
          transition: filter 0.3s ease;
        }

        .privacy-blur:hover {
          filter: blur(3px);
        }

        /* The beautiful gradient speaking animation */
        .speaking-indicator {
          position: relative;
          transition: all 0.3s ease;
        }

        .speaking-indicator::before {
          content: "";
          position: absolute;
          left: -12px;
          top: -10%;
          bottom: -10%;
          width: 4px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(99, 102, 241, 0) 10%,
            rgba(99, 102, 241, 0.4) 25%,
            rgba(139, 92, 246, 0.6) 40%,
            rgba(139, 92, 246, 0.4) 75%,
            rgba(99, 102, 241, 0) 90%,
            transparent 100%
          );
          border-radius: 2px;
          animation: gentleSlide 3s ease-in-out infinite;
          filter: blur(0.5px);
        }

        /* Add a subtle glow effect */
        .speaking-indicator::after {
          content: "";
          position: absolute;
          left: -14px;
          top: -10%;
          bottom: -10%;
          width: 8px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(99, 102, 241, 0) 10%,
            rgba(99, 102, 241, 0.1) 25%,
            rgba(139, 92, 246, 0.15) 40%,
            rgba(236, 72, 153, 0.15) 60%,
            rgba(139, 92, 246, 0.1) 75%,
            rgba(99, 102, 241, 0) 90%,
            transparent 100%
          );
          border-radius: 4px;
          animation: gentleSlide 3s ease-in-out infinite;
          filter: blur(3px);
        }

        @keyframes gentleSlide {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          15% {
            opacity: 0.8;
          }
          50% {
            transform: translateY(0);
            opacity: 1;
          }
          85% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        /* Voice recording animations */
        .recording-pulse {
          animation: recordingPulse 1.5s infinite;
        }

        @keyframes recordingPulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .recording-timer {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          background: rgba(239, 68, 68, 0.1);
          padding: 2px 6px;
          border-radius: 10px;
          white-space: nowrap;
        }

        .voice-processing {
          display: flex;
          gap: 2px;
          align-items: center;
          justify-content: center;
        }

        .voice-processing-bar {
          width: 2px;
          height: 12px;
          background-color: currentColor;
          animation: voiceWave 1s infinite ease-in-out;
        }

        .voice-processing-bar:nth-child(1) {
          animation-delay: 0s;
        }

        .voice-processing-bar:nth-child(2) {
          animation-delay: 0.1s;
        }

        .voice-processing-bar:nth-child(3) {
          animation-delay: 0.2s;
        }

        .voice-processing-bar:nth-child(4) {
          animation-delay: 0.3s;
        }

        @keyframes voiceWave {
          0%,
          100% {
            transform: scaleY(0.5);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
