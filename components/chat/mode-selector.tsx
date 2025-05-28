// components/chat/mode-selector.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModeSelectorProps {
  selectedMode: "chat" | "speech";
  onModeChange: (mode: "chat" | "speech") => void;
}

export default function ModeSelector({
  selectedMode,
  onModeChange,
}: ModeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const modes = [
    {
      id: "chat" as const,
      name: "Chat",
      symbol: "◐",
      gradient: { from: "#6366f1", to: "#818cf8" },
      glow: "rgba(99, 102, 241, 0.3)",
      description: "Text conversation",
      animation: "rotate"
    },
    {
      id: "speech" as const,
      name: "Voice",
      symbol: "◉",
      gradient: { from: "#ec4899", to: "#f472b6" },
      glow: "rgba(236, 72, 153, 0.3)",
      description: "Voice conversation",
      animation: "pulse"
    },
  ];

  const currentMode = modes.find((m) => m.id === selectedMode)!;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Enhanced selector button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-3 py-2 px-4 rounded-2xl transition-all duration-500"
        style={{
          background: isOpen ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: isOpen ? '0 8px 32px rgba(0, 0, 0, 0.08)' : '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Animated mode orb */}
        <div className="relative">
          <motion.div
            className="w-6 h-6 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${currentMode.gradient.from}, ${currentMode.gradient.to})`,
              boxShadow: `0 0 20px ${currentMode.glow}`
            }}
          >
            {/* Inner animation based on mode */}
            {currentMode.animation === "pulse" ? (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: currentMode.gradient.from }}
                  animate={{
                    scale: [0, 1.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ background: currentMode.gradient.to }}
                  animate={{
                    scale: [0, 1.5],
                    opacity: [0.6, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5
                  }}
                />
              </>
            ) : (
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `conic-gradient(from 0deg, transparent, ${currentMode.gradient.from}, ${currentMode.gradient.to}, transparent)`,
                }}
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
            )}
            
            <span className="text-white text-xs font-light relative z-10">
              {currentMode.symbol}
            </span>
          </motion.div>
          
          {/* Mode indicator dot */}
          <motion.div
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ background: currentMode.gradient.from }}
            animate={{
              scale: [0.8, 1.2, 0.8],
              opacity: [1, 0.5, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Mode name */}
        <span className="text-sm font-light text-gray-700 tracking-wide">
          {currentMode.name}
        </span>
        
        {/* Animated chevron */}
        <motion.svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="ml-auto"
        >
          <path 
            d="M6 9L12 15L18 9" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-gray-400"
          />
        </motion.svg>
      </motion.button>
      
      {/* Glass morphism dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ 
                type: "spring",
                stiffness: 300,
                damping: 30
              }}
              className="absolute top-full mt-2 right-0 z-50"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                minWidth: '220px'
              }}
            >
              {/* Glass overlay */}
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/50 to-white/0 pointer-events-none" />
              
              <div className="relative p-2">
                {modes.map((mode, index) => (
                  <motion.button
                    key={mode.id}
                    onClick={() => {
                      onModeChange(mode.id);
                      setIsOpen(false);
                    }}
                    className="w-full text-left rounded-2xl transition-all duration-300 mb-1 last:mb-0"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ 
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      x: 4 
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Mode orb */}
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${mode.gradient.from}, ${mode.gradient.to})`,
                            boxShadow: selectedMode === mode.id 
                              ? `0 0 24px ${mode.glow}` 
                              : `0 0 12px ${mode.glow}`
                          }}
                        >
                          <span className="text-white text-sm font-light">
                            {mode.symbol}
                          </span>
                        </div>
                        
                        {/* Active mode indicator */}
                        {selectedMode === mode.id && (
                          <motion.div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-4 rounded-full"
                            layoutId="activeModeBar"
                            style={{ background: mode.gradient.from }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </div>
                      
                      {/* Mode details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm transition-all duration-300 ${
                            selectedMode === mode.id 
                              ? "text-gray-900 font-medium" 
                              : "text-gray-700"
                          }`}>
                            {mode.name}
                          </span>
                          {selectedMode === mode.id && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: mode.gradient.from }}
                            />
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          {mode.description}
                        </span>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}