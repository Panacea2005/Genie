// components/chat/speech-mode.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Download,
  Copy,
  X,
  Volume2,
  CheckIcon,
  FileText,
  ChevronRight,
} from "lucide-react";
import Groq from "groq-sdk";
import { chatService } from "@/lib/services/chatService";
import { getTTSService } from "@/lib/services/ttsService";
import dynamic from "next/dynamic";

// Import the GradientSphere component
const GradientSphere = dynamic(() => import("@/components/gradient-sphere"), {
  ssr: false,
});

interface SpeechMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  emotion?: {
    primary_emotion: string;
    confidence: number;
    mental_health_category: string;
  };
}

interface SpeechModeProps {
  selectedModel: string;
  selectedVoice: SpeechSynthesisVoice | null;
  onClose: () => void;
}

export default function SpeechMode({
  selectedModel,
  selectedVoice,
  onClose,
}: SpeechModeProps) {
  // State management
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [messages, setMessages] = useState<SpeechMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ttsServiceRef = useRef(getTTSService());
  const transcriptRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Start call
  const startCall = () => {
    setIsCallActive(true);
    setCallDuration(0);
    
    // Start call duration timer
    callTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // Initial greeting
    const greeting = "Hello! I'm Genie, your mental health support assistant. How are you feeling today?";
    setMessages([{
      role: "assistant",
      content: greeting,
      timestamp: new Date(),
    }]);
    
    speakText(greeting);
  };

  // End call
  const endCall = () => {
    setIsCallActive(false);
    
    // Stop any ongoing recording
    if (isRecording) {
      stopRecording();
    }
    
    // Stop any ongoing speech
    const tts = ttsServiceRef.current;
    if (tts && tts.isSpeaking()) {
      tts.stop();
    }
    
    // Clear timer
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };

  // Start recording with audio level monitoring
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Set up audio level monitoring
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      // Monitor audio levels
      const monitorAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average volume
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average / 255); // Normalize to 0-1
          
          animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
        }
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingStop;
      
      mediaRecorder.start();
      setIsRecording(true);
      monitorAudioLevel();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
      
      setIsRecording(false);
      setIsProcessing(true);
      setAudioLevel(0);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Handle recording stop
  const handleRecordingStop = async () => {
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
        }
      };
    } catch (error) {
      console.error("Error processing recording:", error);
      setIsProcessing(false);
    }
  };

  // Process audio with Groq and emotion analysis
  const processAudio = async (base64Audio: string) => {
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

      // Process transcription and emotion analysis in parallel
      const [transcriptionResponse, emotionResponse] = await Promise.allSettled([
        // Transcription
        groq.audio.transcriptions.create({
          model: "whisper-large-v3-turbo",
          file: file,
          language: "en",
        }),
        // Emotion analysis
        analyzeEmotion(base64Audio)
      ]);

      // Handle transcription result
      let transcribedText = "";
      if (transcriptionResponse.status === "fulfilled") {
        transcribedText = transcriptionResponse.value.text;
      } else {
        console.error("Transcription failed:", transcriptionResponse.reason);
      }

             // Handle emotion analysis result
       let emotionData: {
         primary_emotion: string;
         confidence: number;
         mental_health_category: string;
       } | undefined = undefined;
       if (emotionResponse.status === "fulfilled" && emotionResponse.value) {
         emotionData = {
           primary_emotion: emotionResponse.value.primary_emotion,
           confidence: emotionResponse.value.confidence,
           mental_health_category: emotionResponse.value.mental_health_category
         };
         console.log("Emotion detected:", emotionData);
       } else {
         console.warn("Emotion analysis failed or unavailable");
       }
      
      if (transcribedText.trim()) {
        // Add user message with emotion data
        const userMessage: SpeechMessage = {
          role: "user",
          content: transcribedText,
          timestamp: new Date(),
          emotion: emotionData,
        };
        setMessages((prev) => [...prev, userMessage]);

        // Get AI response with emotion context
        await getAIResponse(transcribedText, emotionData);
      }
    } catch (error) {
      console.error("Error processing audio:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Analyze emotion from audio
  const analyzeEmotion = async (base64Audio: string) => {
    try {
      const response = await fetch("http://127.0.0.1:8000/emotion/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audio_data: base64Audio,
          audio_format: "webm",
          session_id: "speech-mode",
          top_emotions: 3,
        }),
      });

      if (!response.ok) {
        throw new Error(`Emotion analysis failed: ${response.status}`);
      }

      const emotionResult = await response.json();
      
      if (emotionResult.error) {
        console.error("Emotion analysis error:", emotionResult.error);
        return null;
      }

      return emotionResult;
    } catch (error) {
      console.error("Failed to analyze emotion:", error);
      return null;
    }
  };

  // Get AI response with emotion context
  const getAIResponse = async (userInput: string, emotionData?: {
    primary_emotion: string;
    confidence: number;
    mental_health_category: string;
  }) => {
    try {
      // Prepare messages with emotion context if available
      const messagesToSend = [
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

             // Include emotion context in the user message if available
       let enhancedUserInput = userInput;
       if (emotionData && emotionData.primary_emotion) {
         enhancedUserInput = `${userInput}\n\n[DETECTED EMOTION: ${emotionData.primary_emotion} (${(emotionData.confidence * 100).toFixed(1)}% confidence, category: ${emotionData.mental_health_category})]`;
       }

       messagesToSend.push({ role: "user", content: enhancedUserInput });

      const response = await chatService.sendMessage(
        messagesToSend,
        selectedModel
      );

      const assistantMessage: SpeechMessage = {
        role: "assistant",
        content: response.response,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Speak the response
      speakText(response.response);
    } catch (error) {
      console.error("Error getting AI response:", error);
    }
  };

  // Speak text using TTS with simulated audio levels
  const speakText = (text: string) => {
    const tts = ttsServiceRef.current;
    if (!tts) return;

    setIsSpeaking(true);
    
    // Simulate audio level changes during speech
    let audioLevelInterval: NodeJS.Timeout;
    const simulateAudioLevels = () => {
      audioLevelInterval = setInterval(() => {
        // Create more natural speech-like variations
        const baseLevel = 0.3;
        const variation = Math.sin(Date.now() * 0.003) * 0.2 + 
                         Math.sin(Date.now() * 0.007) * 0.1 +
                         Math.random() * 0.2;
        setAudioLevel(Math.max(0, Math.min(1, baseLevel + variation)));
      }, 50);
    };
    
    simulateAudioLevels();
    
    // Clean markdown formatting before TTS processing
    const cleanedText = cleanMarkdownText(text);
    const finalText = tts.prepareTextForSpeech(cleanedText);
    
    tts.speak(finalText, {
      voice: selectedVoice ?? undefined,
      rate: 0.9,
      onEnd: () => {
        setIsSpeaking(false);
        setAudioLevel(0);
        clearInterval(audioLevelInterval);
      },
      onError: (error) => {
        console.error("TTS error:", error);
        setIsSpeaking(false);
        setAudioLevel(0);
        clearInterval(audioLevelInterval);
      },
    });
  };

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Clean markdown formatting from text for display
  const cleanMarkdownText = (text: string): string => {
    return text
      // Remove bold formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // Remove italic formatting
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove code formatting
      .replace(/`(.*?)`/g, '$1')
      // Remove headers
      .replace(/#{1,6}\s*(.*)/g, '$1')
      // Remove strikethrough
      .replace(/~~(.*?)~~/g, '$1')
      // Remove links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove line breaks and extra spaces
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Copy transcript
  const copyTranscript = () => {
    const transcript = messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "You" : "Genie"} (${msg.timestamp.toLocaleTimeString()}): ${
            cleanMarkdownText(msg.content)
          }`
      )
      .join("\n\n");

    navigator.clipboard.writeText(transcript).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Download transcript
  const downloadTranscript = () => {
    const transcript = messages
      .map(
        (msg) =>
          `${msg.role === "user" ? "You" : "Genie"} (${msg.timestamp.toLocaleTimeString()}): ${
            cleanMarkdownText(msg.content)
          }${msg.emotion ? `\n[Detected emotion: ${msg.emotion.primary_emotion} (${(msg.emotion.confidence * 100).toFixed(1)}%)]` : ''}`
      )
      .join("\n\n");

    const blob = new Blob([transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genie-conversation-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current && showTranscript) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [messages, showTranscript]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      
      const tts = ttsServiceRef.current;
      if (tts && tts.isSpeaking()) {
        tts.stop();
      }
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-md flex items-center justify-center p-4"
    >
      {/* Main Card Container - 90% size */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative w-full h-full max-w-[90%] max-h-[90%] bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden flex"
      >
        {/* Close button - moved to left */}
        <button
          onClick={onClose}
          className="absolute top-6 left-6 z-10 w-10 h-10 rounded-full bg-gray-100/80 backdrop-blur-sm flex items-center justify-center hover:bg-gray-200/80 transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Main Content Area */}
        <div className={`flex-1 flex items-center justify-center transition-all duration-300 ${
          showTranscript ? 'pr-96' : ''
        }`}>
          {/* Voice Mode UI */}
          <div className="w-full max-w-md h-full flex items-center justify-center">
            {!isCallActive ? (
              /* Start Call State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {/* Large Gradient Sphere - much bigger */}
                <div className="w-64 h-64 mx-auto mb-8 relative flex items-center justify-center">
                  <GradientSphere />
                </div>
                
                <h2 className="text-2xl font-light text-gray-800 mb-2">Voice Mode</h2>
                <p className="text-gray-600 mb-12 font-light">
                  Have a natural conversation with Genie
                </p>
                
                {/* Start button - same size as end call button */}
                <motion.button
                  onClick={startCall}
                  className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 mx-auto flex flex-col items-center justify-center hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Phone className="w-8 h-8 text-white mb-1" />
                  <span className="text-xs text-white font-light">Start</span>
                </motion.button>
              </motion.div>
            ) : (
              /* Active Call State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {/* Enhanced Animated Gradient Sphere with sophisticated speaking animation */}
                <div className="relative mb-8">
                  <div className="w-80 h-80 mx-auto relative flex items-center justify-center">
                    {/* Main sphere container */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Base sphere with dynamic scale based on audio level */}
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center"
                        animate={isSpeaking ? { 
                          scale: 1 + audioLevel * 0.15,
                        } : isRecording ? {
                          scale: 1 + audioLevel * 0.1,
                        } : {}}
                        transition={{ 
                          type: "spring",
                          stiffness: 300,
                          damping: 20
                        }}
                      >
                        <GradientSphere />
                      </motion.div>
                      
                      {/* Multiple layered effects for speaking animation */}
                      {isSpeaking && (
                        <>
                          {/* Primary pulse wave - bigger and clearer */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              opacity: [0, 0.5, 0],
                            }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity,
                              ease: "easeOut",
                              times: [0, 0.5, 1]
                            }}
                            style={{
                              background: `radial-gradient(circle at 50% 50%, transparent 35%, rgba(99, 102, 241, ${0.4 + audioLevel * 0.4}) 50%, rgba(99, 102, 241, ${0.2 + audioLevel * 0.2}) 65%, transparent 75%)`,
                              filter: 'blur(8px)',
                            }}
                          />
                          
                          {/* Secondary pulse wave - bigger with clear rings */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ 
                              scale: [1, 1.7, 1],
                              opacity: [0, 0.4, 0],
                            }}
                            transition={{ 
                              duration: 2.5, 
                              repeat: Infinity,
                              ease: "easeOut",
                              delay: 0.5,
                              times: [0, 0.5, 1]
                            }}
                            style={{
                              background: `radial-gradient(circle at 50% 50%, transparent 25%, rgba(147, 51, 234, ${0.3 + audioLevel * 0.3}) 40%, rgba(147, 51, 234, ${0.15 + audioLevel * 0.15}) 55%, transparent 70%)`,
                              filter: 'blur(10px)',
                            }}
                          />
                          
                          {/* Third wave for more depth */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ 
                              scale: [1, 2, 1],
                              opacity: [0, 0.3, 0],
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity,
                              ease: "easeOut",
                              delay: 1,
                              times: [0, 0.5, 1]
                            }}
                            style={{
                              background: `radial-gradient(circle at 50% 50%, transparent 20%, rgba(168, 85, 247, ${0.25 + audioLevel * 0.25}) 35%, transparent 60%)`,
                              filter: 'blur(12px)',
                            }}
                          />
                          
                          {/* Dynamic audio-reactive glow - more prominent */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ 
                              opacity: 0.5 + audioLevel * 0.5,
                            }}
                            transition={{ 
                              type: "spring",
                              stiffness: 400,
                              damping: 30
                            }}
                            style={{
                              background: `radial-gradient(circle at 50% 50%, rgba(168, 85, 247, ${0.4 + audioLevel * 0.5}) 0%, rgba(99, 102, 241, ${0.2 + audioLevel * 0.3}) 40%, transparent 70%)`,
                              filter: 'blur(20px)',
                              transform: `scale(${1.2 + audioLevel * 0.3})`,
                            }}
                          />
                          
                          {/* Inner core glow - brighter */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ 
                              scale: [0.7, 0.85, 0.7],
                              opacity: [0.4, 0.7, 0.4],
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            style={{
                              background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${0.6 + audioLevel * 0.4}) 0%, transparent 50%)`,
                              filter: 'blur(15px)',
                            }}
                          />
                        </>
                      )}
                      
                      {/* Recording animation */}
                      {isRecording && (
                        <>
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.1, 0.3, 0.1],
                            }}
                            transition={{ 
                              duration: 1.5, 
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            style={{
                              background: `radial-gradient(circle at 50% 50%, transparent 30%, rgba(239, 68, 68, ${0.2 + audioLevel * 0.3}) 50%, transparent 70%)`,
                              filter: 'blur(15px)',
                            }}
                          />
                          
                          {/* Audio level indicator ring */}
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              background: `conic-gradient(from 0deg, transparent, rgba(239, 68, 68, ${audioLevel}), transparent)`,
                              filter: 'blur(10px)',
                              transform: `scale(${1.3 + audioLevel * 0.1})`,
                            }}
                            animate={{
                              rotate: 360,
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Timer */}
                <div className="mb-8">
                  <p className="text-4xl font-light text-gray-800 tabular-nums">
                    {formatDuration(callDuration)}
                  </p>
                </div>

                {/* Status indicators */}
                <div className="flex justify-center gap-3 mb-12 min-h-[32px]">
                  <AnimatePresence mode="wait">
                    {isRecording && (
                      <motion.div
                        key="recording"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full"
                      >
                        <motion.div 
                          className="w-2 h-2 bg-red-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                        <span className="text-sm text-red-700 font-light">Recording</span>
                      </motion.div>
                    )}
                    
                    {isProcessing && (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-full"
                      >
                        <motion.div 
                          className="w-2 h-2 bg-indigo-500 rounded-full"
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <span className="text-sm text-indigo-700 font-light">Processing</span>
                      </motion.div>
                    )}
                    
                    {isSpeaking && (
                      <motion.div
                        key="speaking"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full"
                      >
                        <motion.div className="flex items-center gap-1">
                          {[...Array(3)].map((_, i) => (
                            <motion.div
                              key={i}
                              className="w-1 h-3 bg-purple-600 rounded-full"
                              animate={{
                                height: ["12px", "20px", "12px"],
                              }}
                              transition={{
                                duration: 0.6,
                                repeat: Infinity,
                                delay: i * 0.1,
                              }}
                            />
                          ))}
                        </motion.div>
                        <span className="text-sm text-purple-700 font-light ml-1">Genie is speaking</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Control Buttons - smaller size */}
                <div className="flex justify-center gap-8">
                  {/* Record/Stop Button */}
                  <motion.button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || isSpeaking}
                    className={`w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all shadow-lg ${
                      isRecording
                        ? "bg-gradient-to-r from-red-400 to-red-500"
                        : isProcessing || isSpeaking
                        ? "bg-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-500 hover:to-purple-500"
                    }`}
                    whileHover={!isProcessing && !isSpeaking ? { scale: 1.05 } : {}}
                    whileTap={!isProcessing && !isSpeaking ? { scale: 0.95 } : {}}
                  >
                    {isRecording ? (
                      <>
                        <MicOff className="w-8 h-8 text-white mb-1" />
                        <span className="text-xs text-white font-light">Stop</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-8 h-8 text-white mb-1" />
                        <span className="text-xs text-white font-light">Speak</span>
                      </>
                    )}
                  </motion.button>

                  {/* End Call Button */}
                  <motion.button
                    onClick={endCall}
                    className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 hover:from-red-400 hover:to-red-500 flex flex-col items-center justify-center transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <PhoneOff className="w-8 h-8 text-white mb-1" />
                    <span className="text-xs text-white font-light">End</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Transcript Toggle Button */}
        {isCallActive && (
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-24 bg-gray-100/80 backdrop-blur-sm rounded-l-2xl shadow-md flex flex-col items-center justify-center hover:bg-gray-200/80 transition-all group"
          >
            <FileText className="w-5 h-5 text-gray-600 mb-1" />
            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Transcript Panel */}
        <AnimatePresence>
          {showTranscript && (
            <motion.div
              initial={{ x: 384, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 384, opacity: 0 }}
              transition={{ type: "spring", damping: 30 }}
              className="absolute right-0 top-0 bottom-0 w-96 bg-gray-50/90 backdrop-blur-sm border-l border-gray-200"
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-light text-gray-800">Transcript</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={copyTranscript}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title="Copy transcript"
                      >
                        {copied ? (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={downloadTranscript}
                        className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                        title="Download transcript"
                      >
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={transcriptRef}
                  className="flex-1 overflow-y-auto p-6 space-y-4"
                >
                  {messages.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm">
                      Transcript will appear here...
                    </p>
                  ) : (
                    messages.map((msg, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`${
                          msg.role === "user" ? "ml-8" : "mr-8"
                        }`}
                      >
                        <div
                          className={`p-4 rounded-lg ${
                            msg.role === "user"
                              ? "bg-indigo-50 border border-indigo-100"
                              : "bg-white border border-gray-100"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-medium ${
                              msg.role === "user" ? "text-indigo-600" : "text-gray-600"
                            }`}>
                              {msg.role === "user" ? "You" : "Genie"}
                            </span>
                            <span className="text-xs text-gray-400">
                              {msg.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed">{cleanMarkdownText(msg.content)}</p>
                          {msg.emotion && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                              Detected emotion: {msg.emotion.primary_emotion} ({(msg.emotion.confidence * 100).toFixed(1)}%)
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
