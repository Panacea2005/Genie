"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import {
  Play,
  Pause,
  Headphones,
  Plus,
} from "lucide-react";

// Import Navigation component
const Navbar = dynamic(() => import("@/components/navbar"), {
  ssr: false,
});

// Import the gradient sphere component
const GradientSphere = dynamic(() => import("@/components/gradient-sphere"), {
  ssr: false,
});

// Color themes for each meditation topic
const topicColors = {
  "breath-of-calm": {
    center: 'rgba(190, 205, 255, 0.95)',
    mid1: 'rgba(180, 190, 255, 0.9)',
    mid2: 'rgba(200, 180, 255, 0.8)',
    edge: 'rgba(220, 175, 230, 0.6)',
  },
  "self-compassion": {
    center: 'rgba(255, 200, 220, 0.95)',
    mid1: 'rgba(255, 180, 210, 0.9)',
    mid2: 'rgba(240, 160, 200, 0.8)',
    edge: 'rgba(220, 140, 180, 0.6)',
  },
  "anxiety-relief": {
    center: 'rgba(180, 220, 255, 0.95)',
    mid1: 'rgba(160, 210, 255, 0.9)',
    mid2: 'rgba(140, 200, 255, 0.8)',
    edge: 'rgba(120, 180, 240, 0.6)',
  },
  "sleep-preparation": {
    center: 'rgba(210, 190, 255, 0.95)',
    mid1: 'rgba(200, 170, 255, 0.9)',
    mid2: 'rgba(190, 150, 255, 0.8)',
    edge: 'rgba(170, 130, 240, 0.6)',
  },
  "morning-intention": {
    center: 'rgba(255, 240, 200, 0.95)',
    mid1: 'rgba(255, 230, 180, 0.9)',
    mid2: 'rgba(255, 220, 160, 0.8)',
    edge: 'rgba(240, 200, 140, 0.6)',
  },
};

// Meditation topics with full content
const meditationTopics = [
  {
    id: "breath-of-calm",
    title: "Breath of Calm",
    description: "An invitation to find peace in moments of anxiety and stress. With each inhale and exhale, we become part of tranquility's quiet rhythm, breathing as one, rooted in shared presence.",
    duration: "5:20 mins",
    author: "Words by Genie AI",
    voice: "Voice by Michelle Newell",
    content: [
      "What is the limit of your breath",
      "that flows into the world around you,",
      "Feel the air entering through your nose.",
      "Notice how your chest and belly gently rise.",
      "As you exhale, let your shoulders drop.",
      "Release any tension you're holding.",
      "Breathe in calm and peace.",
      "Breathe out worry and stress.",
      "Each breath is a moment of renewal.",
      "You are safe in this moment.",
      "Your breath is your anchor.",
      "connecting you to this present moment,",
      "where peace naturally resides.",
      "Return to this breath whenever you need stillness.",
      "Take three more conscious breaths.",
      "When you're ready, carry this calm with you."
    ]
  },
  {
    id: "self-compassion",
    title: "Self-Compassion",
    description: "A gentle practice to treat yourself with the same kindness you would offer a dear friend. Through mindful self-acceptance, we learn to embrace our humanity with grace.",
    duration: "7:15 mins",
    author: "Words by Genie AI",
    voice: "Voice by Michelle Newell",
    content: [
      "What does it mean to be kind to yourself",
      "in this very moment,",
      "Place one hand on your heart, one on your belly.",
      "Feel the warmth of your own touch.",
      "This is a gesture of kindness to yourself.",
      "You are human, and humans are imperfect.",
      "This is part of our shared experience.",
      "Your struggles do not define your worth.",
      "You deserve the same compassion you give others.",
      "Breathe in acceptance of yourself.",
      "Breathe out harsh judgment.",
      "extending through every part of your being,",
      "You are enough, exactly as you are.",
      "May you be kind to yourself.",
      "May you find peace with who you are becoming."
    ]
  },
  {
    id: "anxiety-relief",
    title: "Anxiety Relief",
    description: "Ground yourself in the present moment and find relief from anxious thoughts. A practice of returning to what is real, stable, and peaceful within you.",
    duration: "6:45 mins",
    author: "Words by Genie AI",
    voice: "Voice by Michelle Newell",
    content: [
      "Where does anxiety live in your body",
      "and how can we gently release it,",
      "You are safe right now, in this moment.",
      "Let's ground ourselves in the present.",
      "Notice five things you can see around you.",
      "Four things you can touch or feel.",
      "Three things you can hear.",
      "Two things you can smell.",
      "One thing you can taste.",
      "Now, place your feet firmly on the ground.",
      "Feel your connection to the earth beneath you.",
      "Anxious thoughts are like clouds passing through the sky.",
      "letting them drift away naturally,",
      "You are the sky - vast, open, unchanging.",
      "You have survived difficult moments before.",
      "Trust in your ability to navigate this moment."
    ]
  },
  {
    id: "sleep-preparation",
    title: "Sleep Preparation",
    description: "Gentle guidance to release the day and prepare your mind and body for rest. A transition from the activity of day into the peace of night.",
    duration: "8:20 mins",
    author: "Words by Genie AI",
    voice: "Voice by Michelle Newell",
    content: [
      "How do we let go of the day",
      "and welcome the gift of rest,",
      "Make yourself comfortable in your bed.",
      "Let your body sink into the mattress.",
      "Feel supported by what lies beneath you.",
      "With each exhale, release the day's concerns.",
      "Let go of anything you need to do tomorrow.",
      "This time is for rest and restoration.",
      "Starting from the top of your head, relax every muscle.",
      "Let your forehead smooth and soften.",
      "Feel your shoulders melting away from your ears.",
      "Release any tightness in your chest.",
      "flowing through your entire being,",
      "From the tips of your toes to the top of your head, completely relaxed.",
      "You are safe and protected as you sleep.",
      "Allow yourself to drift into peaceful rest."
    ]
  },
  {
    id: "morning-intention",
    title: "Morning Intention",
    description: "Start your day with clarity, purpose, and positive intention. A practice of setting the tone for how you want to move through the world.",
    duration: "4:50 mins",
    author: "Words by Genie AI",
    voice: "Voice by Michelle Newell",
    content: [
      "What intention will guide your day",
      "flowing through each moment ahead,",
      "Before the day begins, take this moment for yourself.",
      "Feel gratitude for another day of life.",
      "What quality do you want to embody today?",
      "Perhaps it's patience, kindness, or presence.",
      "Hold this intention gently in your heart.",
      "Imagine carrying it with you through the day.",
      "See yourself responding to challenges with this quality.",
      "You have the power to choose how you show up today.",
      "Breathe in possibility and potential.",
      "Breathe out doubt and limitation.",
      "radiating outward into your world,",
      "Trust in your ability to navigate whatever comes.",
      "Set the tone for a day filled with purpose.",
      "Step into this day with confidence and grace."
    ]
  }
];

// Background music URL (to be replaced with actual URL)
const BACKGROUND_MUSIC_URL = "/audio/meditation-background-music.mp3"; 

export default function MeditationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const textTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const pausedAtRef = useRef<number>(-1);
  const remainingTimeoutsRef = useRef<{ index: number; delay: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    setMounted(true);

    // Initialize background music
    if (BACKGROUND_MUSIC_URL) {
      audioRef.current = new Audio(BACKGROUND_MUSIC_URL);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3; // Set to 30% volume
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [user]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      textTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleTopicSelect = (topic: typeof meditationTopics[0]) => {
    if (isPlaying) {
      handleStop();
    }
    
    setSelectedTopic(topic);
    setCurrentTextIndex(-1);
  };

  const speakText = (text: string, index: number) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8; // Slower for meditation
      utterance.pitch = 0.9;
      utterance.volume = 1;
      
      // Set voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Samantha') || 
        voice.name.includes('Victoria') ||
        voice.name.includes('Karen')
      );
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onstart = () => {
        setCurrentTextIndex(index);
      };

      utterance.onend = () => {
        if (index < selectedTopic.content.length - 1 && !isPaused) {
          // Small pause between lines
          setTimeout(() => {
            if (!isPaused) {
              speakText(selectedTopic.content[index + 1], index + 1);
            }
          }, 800);
        } else if (index === selectedTopic.content.length - 1) {
          // End of meditation
          setTimeout(() => {
            handleStop();
          }, 2000);
        }
      };

      speechSynthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePlay = () => {
    console.log("Starting meditation...");
    setIsPlaying(true);
    setIsPaused(false);

    // Start background music
    if (audioRef.current && BACKGROUND_MUSIC_URL) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }

    // Clear any existing timeouts
    textTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    textTimeoutsRef.current = [];

    if ('speechSynthesis' in window) {
      // Use speech synthesis
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      
      // Start with first text after a brief delay
      setTimeout(() => {
        speakText(selectedTopic.content[0], 0);
      }, 1000);
    } else {
      // Fallback to timed text display
      setCurrentTextIndex(0);
      let cumulativeDelay = 1000;
      
      selectedTopic.content.forEach((text, index) => {
        if (index === 0) {
          setCurrentTextIndex(0);
          return;
        }
        
        const words = text.split(' ').length;
        const speakingTime = words * 400 + 800; // 400ms per word + pause
        
        const timeout = setTimeout(() => {
          if (!isPaused) {
            setCurrentTextIndex(index);
          }
        }, cumulativeDelay);
        
        textTimeoutsRef.current.push(timeout);
        cumulativeDelay += speakingTime;
      });

      // End meditation after all text
      const endTimeout = setTimeout(() => {
        handleStop();
      }, cumulativeDelay + 2000);
      
      textTimeoutsRef.current.push(endTimeout);
    }
  };

  const handlePause = () => {
    if (isPlaying && !isPaused) {
      // Pause
      setIsPaused(true);
      pausedAtRef.current = currentTextIndex;
      
      // Pause speech synthesis
      if (window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
      
      // Pause background music
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // Clear remaining timeouts
      textTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    } else if (isPlaying && isPaused) {
      // Resume
      setIsPaused(false);
      
      // Resume speech synthesis
      if (window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      
      // Resume background music
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio resume failed:", e));
      }
    }
  };

  const handleStop = () => {
    console.log("Stopping meditation...");
    
    // Stop speech synthesis
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    // Stop background music with fade out
    if (audioRef.current) {
      const fadeOut = setInterval(() => {
        if (audioRef.current && audioRef.current.volume > 0.01) {
          audioRef.current.volume -= 0.05;
        } else {
          clearInterval(fadeOut);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.3;
          }
        }
      }, 50);
    }
    
    // Clear all timeouts
    textTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    textTimeoutsRef.current = [];
    
    // Reset state
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTextIndex(-1);
    pausedAtRef.current = -1;
  };

  if (!mounted) return null;

  const currentColors = topicColors[selectedTopic.id as keyof typeof topicColors];

  return (
    <main className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Navbar */}
      <Navbar currentPage="meditation" />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Topic list */}
        <div className="w-64 px-8 py-4 flex items-center">
          <motion.div 
            className="space-y-4 w-full"
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

        {/* Main content area */}
        <div className="flex-1 relative flex items-center justify-center">
          {/* Background gradient sphere - with transition */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedTopic.id}
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
            >
              <div className="transform scale-125">
                <GradientSphere/>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Content */}
          <div className="relative z-10 w-full h-full flex items-center justify-center px-12">
            <AnimatePresence mode="wait">
              {currentTextIndex === -1 ? (
                /* Initial state - Show all content */
                <motion.div
                  key="intro"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center max-w-4xl w-full space-y-6"
                >
                  <motion.h1 
                    className="text-5xl md:text-6xl font-light mb-8 text-gray-800"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    {selectedTopic.title}
                  </motion.h1>

                  <motion.p 
                    className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    {selectedTopic.description}
                  </motion.p>

                  <motion.div 
                    className="text-gray-500 mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Length: {selectedTopic.duration}
                  </motion.div>

                  <motion.div 
                    className="text-sm text-gray-400 space-y-1 mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div>{selectedTopic.author}</div>
                    <div>{selectedTopic.voice}</div>
                  </motion.div>

                  {/* Instructions */}
                  <motion.div 
                    className="flex flex-col items-center space-y-2 mb-12 text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center">
                      <Headphones className="w-4 h-4 mr-2" />
                      Use headphones for full immersion.
                    </div>
                    <div>Find a posture that brings ease to your body.</div>
                  </motion.div>

                  {/* Play button container with centering */}
                  <motion.div 
                    className="flex justify-center w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.65 }}
                  >
                    {/* Play button */}
                    <motion.button
                      onClick={handlePlay}
                      className="relative w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:border-white/40 flex items-center justify-center group transition-all shadow-xl"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 20 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Play className="w-10 h-10 text-gray-800/80 ml-1 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                      
                      {/* Pulse rings */}
                      <motion.div
                        className="absolute inset-0 rounded-full border border-gray-300/30"
                        animate={{
                          scale: [1, 1.5, 1.5],
                          opacity: [0.5, 0, 0],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeOut",
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border border-gray-300/20"
                        animate={{
                          scale: [1, 1.3, 1.3],
                          opacity: [0.3, 0, 0],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "easeOut",
                          delay: 0.5,
                        }}
                      />
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                /* Playing state */
                <motion.div
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center w-full h-full"
                >
                  {/* Current text - Large and centered */}
                  <div className="flex-1 flex items-center justify-center w-full px-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentTextIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.8 }}
                        className="text-center"
                      >
                        <p className="text-4xl md:text-5xl lg:text-6xl font-light leading-relaxed text-gray-800/90">
                          {selectedTopic.content[currentTextIndex]}
                        </p>
                        
                        {/* Preview of next line */}
                        {currentTextIndex + 1 < selectedTopic.content.length && (
                          <p className="text-xl md:text-2xl text-gray-400 mt-12 opacity-60">
                            {selectedTopic.content[currentTextIndex + 1]}
                          </p>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Playback controls */}
                  <div className="flex items-center gap-6 pb-16">
                    <button
                      onClick={handlePause}
                      className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 hover:border-white/40 flex items-center justify-center shadow-lg transition-all"
                      aria-label={isPaused ? "Resume" : "Pause"}
                    >
                      {isPaused ? (
                        <Play className="w-5 h-5 text-gray-800/80 ml-0.5" strokeWidth={1.5} />
                      ) : (
                        <Pause className="w-5 h-5 text-gray-800/80" strokeWidth={1.5} />
                      )}
                    </button>
                    
                    <button
                      onClick={handleStop}
                      className="px-6 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-gray-700/80 transition-all text-sm font-light"
                    >
                      End session
                    </button>
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