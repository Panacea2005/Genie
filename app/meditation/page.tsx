"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Play,
  Pause,
  Headphones,
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  Timer,
  Heart,
  Sparkles,
  Moon,
  Sun,
  Wind,
} from "lucide-react";
// Import the meditation content from the separate file
import { meditationTopics } from "./meditation-content";

// Import Navigation component
const Navbar = dynamic(() => import("@/components/navbar"), {
  ssr: false,
});

// Import the gradient sphere component
const GradientSphere = dynamic(() => import("@/components/gradient-sphere"), {
  ssr: false,
});

// Background music URL
const BACKGROUND_MUSIC_URL = "/audio/meditation-background-music.mp3";

// Category icons
const categoryIcons = {
  mindfulness: <Sparkles className="w-4 h-4" />,
  sleep: <Moon className="w-4 h-4" />,
  anxiety: <Wind className="w-4 h-4" />,
  focus: <Sun className="w-4 h-4" />,
  healing: <Heart className="w-4 h-4" />,
  gratitude: <Sparkles className="w-4 h-4" />,
  relationships: <Heart className="w-4 h-4" />,
  creativity: <Sun className="w-4 h-4" />,
};

export default function MeditationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const breathingAnimation = useAnimation();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  const [mounted, setMounted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(meditationTopics[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(-1);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showBreathingGuide, setShowBreathingGuide] = useState(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resumeIndexRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;
    setMounted(true);

    // Initialize background music
    if (BACKGROUND_MUSIC_URL) {
      audioRef.current = new Audio(BACKGROUND_MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = isMuted ? 0 : 0.3;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user, isMuted]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Breathing animation effect
  useEffect(() => {
    if (showBreathingGuide && !isPlaying) {
      const breathingSequence = async () => {
        while (showBreathingGuide && !isPlaying) {
          // Inhale
          await breathingAnimation.start({
            scale: 1.2,
            transition: { duration: 4, ease: "easeInOut" }
          });
          // Hold
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Exhale
          await breathingAnimation.start({
            scale: 1,
            transition: { duration: 4, ease: "easeInOut" }
          });
          // Hold
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      };
      breathingSequence();
    }
  }, [showBreathingGuide, isPlaying, breathingAnimation]);

  const handleTopicSelect = (topic: typeof meditationTopics[0]) => {
    if (isPlaying) {
      handleStop();
    }
    
    setSelectedTopic(topic);
    setCurrentTextIndex(-1);
    setProgress(0);
    setElapsedTime(0);
  };

  const speakText = useCallback((text: string, index: number) => {
    if ('speechSynthesis' in window && !isPaused) {
      // Cancel any previous speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower for meditation
      utterance.pitch = 0.9;
      utterance.volume = isMuted ? 0 : 1;
      
      // Set voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Victoria') ||
        voice.name.includes('Karen') ||
        voice.name.includes('Google UK English Female')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => {
        setCurrentTextIndex(index);
        resumeIndexRef.current = index;
      };

      utterance.onend = () => {
        if (index < selectedTopic.content.length - 1 && !isPaused) {
          // Small pause between lines (longer for empty lines)
          const pauseDuration = text.trim() === "" ? 2000 : 1200;
          speechTimeoutRef.current = setTimeout(() => {
            if (!isPaused) {
              speakText(selectedTopic.content[index + 1], index + 1);
            }
          }, pauseDuration);
        } else if (index === selectedTopic.content.length - 1) {
          // End of meditation
          speechTimeoutRef.current = setTimeout(() => {
            handleStop();
          }, 3000);
        }
      };

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  }, [isPaused, isMuted, selectedTopic.content]);

  const handlePlay = () => {
    console.log("Starting meditation...");
    setIsPlaying(true);
    setIsPaused(false);
    setShowBreathingGuide(false);

    // Start background music
    if (audioRef.current && BACKGROUND_MUSIC_URL && !isMuted) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    // Start progress tracking
    const startTime = Date.now() - elapsedTime * 1000;
    progressIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      setElapsedTime(elapsed);
      const durationStr = selectedTopic.duration ?? "0:00";
      const [mins, secs] = durationStr.split(':');
      const totalDuration = (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);
      setProgress((elapsed / totalDuration) * 100);
    }, 100);

    if ('speechSynthesis' in window) {
      // Clear any existing speech
      window.speechSynthesis.cancel();
      
      // Start with first text or resume from paused position
      const startIndex = resumeIndexRef.current;
      speechTimeoutRef.current = setTimeout(() => {
        speakText(selectedTopic.content[startIndex], startIndex);
      }, 1500);
    }
  };

  const handlePause = () => {
    if (isPlaying && !isPaused) {
      // Pause
      setIsPaused(true);
      
      // Cancel speech and clear timeout
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      
      // Pause background music
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Pause progress tracking
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    } else if (isPlaying && isPaused) {
      // Resume
      setIsPaused(false);
      
      // Resume background music
      if (audioRef.current && !isMuted) {
        audioRef.current.play().catch(e => console.log("Audio resume failed:", e));
      }
      
      // Resume progress tracking
      const startTime = Date.now() - elapsedTime * 1000;
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setElapsedTime(elapsed);
        const durationStr = selectedTopic.duration ?? "0:00";
        const [mins, secs] = durationStr.split(':');
        const totalDuration = (parseInt(mins) || 0) * 60 + (parseInt(secs) || 0);
        setProgress((elapsed / totalDuration) * 100);
      }, 100);
      
      // Resume speech from current position
      speechTimeoutRef.current = setTimeout(() => {
        speakText(selectedTopic.content[resumeIndexRef.current], resumeIndexRef.current);
      }, 500);
    }
  };

  const handleStop = () => {
    console.log("Stopping meditation...");
    
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
    }
    
    // Stop background music with fade out
    if (audioRef.current) {
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.01) {
          audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05);
        } else {
          clearInterval(fadeOut);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.volume = isMuted ? 0 : 0.3;
          }
        }
      }, 50);
    }
    
    // Stop progress tracking
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    
    // Reset state
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTextIndex(-1);
    setProgress(0);
    setElapsedTime(0);
    resumeIndexRef.current = 0;
  };

  const handleSkipForward = () => {
    if (isPlaying && currentTextIndex < selectedTopic.content.length - 1) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      const nextIndex = Math.min(currentTextIndex + 1, selectedTopic.content.length - 1);
      resumeIndexRef.current = nextIndex;
      speakText(selectedTopic.content[nextIndex], nextIndex);
    }
  };

  const handleSkipBack = () => {
    if (isPlaying && currentTextIndex > 0) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      const prevIndex = Math.max(currentTextIndex - 1, 0);
      resumeIndexRef.current = prevIndex;
      speakText(selectedTopic.content[prevIndex], prevIndex);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0.3 : 0;
    }
    if (window.speechSynthesis && speechSynthesisRef.current) {
      speechSynthesisRef.current.volume = isMuted ? 1 : 0;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mounted) return null;

  // Use the color theme from the selected topic
  const currentColors = selectedTopic.colorTheme;

  return (
    <main className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Navbar */}
      <Navbar currentPage="meditation" />

      {/* Ambient particles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -20, 20],
              x: [null, -10, 10],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Minimal Topic list with scroll */}
        <div className="w-64 flex flex-col">
          <div className="flex-1 overflow-y-auto px-8 py-4">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              {meditationTopics.map((topic, index) => (
                <motion.button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className={`block w-full text-left transition-all duration-500 group relative ${
                    selectedTopic.id === topic.id
                      ? 'text-gray-800 font-medium'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 8 }}
                >
                  <motion.span 
                    className="flex items-center gap-3"
                    animate={{
                      x: selectedTopic.id === topic.id ? 10 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.span 
                      className={`block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                        selectedTopic.id === topic.id 
                          ? 'bg-gray-800' 
                          : 'bg-transparent'
                      }`}
                      animate={{
                        scale: selectedTopic.id === topic.id ? [1, 1.2, 1] : 1,
                        opacity: selectedTopic.id === topic.id ? 1 : 0,
                      }}
                      transition={{
                        scale: {
                          duration: 2,
                          repeat: selectedTopic.id === topic.id ? Infinity : 0,
                          ease: "easeInOut"
                        },
                        opacity: { duration: 0.3 }
                      }}
                    />
                    <span className={`transition-all duration-300 ${
                      selectedTopic.id === topic.id ? 'translate-x-0' : ''
                    }`}>
                      {topic.title}
                    </span>
                  </motion.span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Background gradient sphere - with smooth transition */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedTopic.id}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              animate={{ opacity: 0.6, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
              transition={{ duration: 1.2 }}
            >
              <div className="transform scale-150">
                <GradientSphere colors={currentColors} />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 w-full h-full flex items-center justify-center px-8">
            <AnimatePresence mode="wait">
              {currentTextIndex === -1 ? (
                /* Initial state - Enhanced intro screen */
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center max-w-5xl w-full"
                >
                  {/* Category badge */}
                  <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    {categoryIcons[selectedTopic.category]}
                    <span className="text-sm text-gray-600 capitalize">
                      {selectedTopic.category}
                    </span>
                  </motion.div>

                  <motion.h1 
                    className="text-5xl md:text-6xl font-light mb-6 text-gray-800"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {selectedTopic.title}
                  </motion.h1>

                  <motion.p 
                    className="text-lg text-gray-600 leading-relaxed max-w-2xl mx-auto mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {selectedTopic.description}
                  </motion.p>

                  {/* Session info */}
                  <motion.div 
                    className="flex items-center justify-center gap-8 text-gray-500 mb-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span>{selectedTopic.duration}</span>
                    </div>
                    <div className="w-px h-4 bg-gray-300" />
                    <div className="text-sm">{selectedTopic.author}</div>
                    <div className="w-px h-4 bg-gray-300" />
                    <div className="text-sm">{selectedTopic.voice}</div>
                  </motion.div>

                  {/* Instructions with breathing guide option */}
                  <motion.div 
                    className="flex flex-col items-center space-y-4 mb-12"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-6 text-gray-500">
                      <div className="flex items-center gap-2">
                        <Headphones className="w-4 h-4" />
                        <span>Use headphones for full immersion</span>
                      </div>
                      <div className="w-px h-4 bg-gray-300" />
                      <button
                        onClick={() => setShowBreathingGuide(!showBreathingGuide)}
                        className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                      >
                        <Wind className="w-4 h-4" />
                        <span>Breathing guide</span>
                      </button>
                    </div>
                    
                    {/* Breathing guide visualization */}
                    <AnimatePresence>
                      {showBreathingGuide && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-col items-center gap-4 pt-4"
                        >
                          <motion.div
                            animate={breathingAnimation}
                            className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 backdrop-blur-sm flex items-center justify-center"
                          >
                            <span className="text-gray-600 text-sm">Breathe</span>
                          </motion.div>
                          <p className="text-sm text-gray-500">
                            Follow the circle: inhale as it expands, exhale as it contracts
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Enhanced Play button with controls */}
                  <motion.div 
                    className="flex flex-col items-center gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Mute button */}
                      <motion.button
                        onClick={toggleMute}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 flex items-center justify-center transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isMuted ? (
                          <VolumeX className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Volume2 className="w-5 h-5 text-gray-600" />
                        )}
                      </motion.button>

                      {/* Main play button */}
                      <motion.button
                        onClick={handlePlay}
                        className="relative w-24 h-24 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md border border-white/40 hover:border-white/60 flex items-center justify-center group transition-all shadow-2xl"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-10 h-10 text-gray-800 ml-1 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        
                        {/* Enhanced pulse rings */}
                        <motion.div
                          className="absolute inset-0 rounded-full border border-gradient-to-r from-indigo-300/30 to-purple-300/30"
                          animate={{
                            scale: [1, 1.5, 1.5],
                            opacity: [0.5, 0, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border border-gradient-to-r from-indigo-300/20 to-purple-300/20"
                          animate={{
                            scale: [1, 1.3, 1.3],
                            opacity: [0.3, 0, 0],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeOut",
                            delay: 1,
                          }}
                        />
                      </motion.button>
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      Press play when you're ready to begin
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                /* Playing state - Enhanced meditation view */
                <motion.div
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center w-full h-full"
                >
                  {/* Progress bar at top */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
                    <motion.div
                      className="h-full bg-gradient-to-r from-indigo-400/50 to-purple-400/50"
                      style={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>

                  {/* Timer display */}
                  <div className="absolute top-4 right-8 text-sm text-gray-500">
                    {formatTime(elapsedTime)} / {selectedTopic.duration}
                  </div>

                  {/* Current text - Enhanced display */}
                  <div className="flex-1 flex items-center justify-center w-full px-8 max-w-5xl">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTextIndex}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0.95 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="text-center"
                      >
                        {/* Current line with enhanced typography */}
                        <p className="text-3xl md:text-4xl lg:text-5xl font-light leading-relaxed text-gray-800/90 mb-12">
                          {selectedTopic.content[currentTextIndex]}
                        </p>
                        
                        {/* Progress indicator */}
                        <div className="flex justify-center gap-1 mb-6">
                          {[...Array(Math.min(5, selectedTopic.content.length))].map((_, i) => {
                            const dotIndex = Math.max(0, Math.min(currentTextIndex - 2 + i, selectedTopic.content.length - 1));
                            return (
                              <motion.div
                                key={i}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                  dotIndex === currentTextIndex 
                                    ? 'bg-gray-600 w-8' 
                                    : dotIndex < currentTextIndex 
                                    ? 'bg-gray-300' 
                                    : 'bg-gray-200'
                                }`}
                              />
                            );
                          })}
                        </div>
                        
                        {/* Preview of next line with fade effect */}
                        {currentTextIndex + 1 < selectedTopic.content.length && selectedTopic.content[currentTextIndex + 1].trim() !== "" && (
                          <motion.p 
                            className="text-lg md:text-xl text-gray-400/60 mt-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ delay: 0.5 }}
                          >
                            {selectedTopic.content[currentTextIndex + 1]}
                          </motion.p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Enhanced playback controls */}
                  <div className="absolute bottom-8 flex items-center gap-6 bg-white/10 backdrop-blur-md rounded-full px-8 py-4 border border-white/20">
                    {/* Skip back */}
                    <motion.button
                      onClick={handleSkipBack}
                      className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={currentTextIndex === 0}
                    >
                      <SkipBack className={`w-5 h-5 ${currentTextIndex === 0 ? 'text-gray-400' : 'text-gray-600'}`} />
                    </motion.button>

                    {/* Play/Pause */}
                    <motion.button
                      onClick={handlePause}
                      className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isPaused ? (
                        <Play className="w-6 h-6 text-gray-700 ml-0.5" strokeWidth={1.5} />
                      ) : (
                        <Pause className="w-6 h-6 text-gray-700" strokeWidth={1.5} />
                      )}
                    </motion.button>

                    {/* Skip forward */}
                    <motion.button
                      onClick={handleSkipForward}
                      className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={currentTextIndex === selectedTopic.content.length - 1}
                    >
                      <SkipForward className={`w-5 h-5 ${currentTextIndex === selectedTopic.content.length - 1 ? 'text-gray-400' : 'text-gray-600'}`} />
                    </motion.button>

                    <div className="w-px h-8 bg-white/20 mx-2" />

                    {/* Volume control */}
                    <motion.button
                      onClick={toggleMute}
                      className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-gray-600" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-gray-600" />
                      )}
                    </motion.button>

                    <div className="w-px h-8 bg-white/20 mx-2" />
                    
                    {/* End session */}
                    <motion.button
                      onClick={handleStop}
                      className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-600 transition-all text-sm font-light"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      End session
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}