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
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" 
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: "speech" as const,
      name: "Voice",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" 
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" 
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
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
      {/* Minimal mode toggle */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center gap-2 py-1.5 px-3 rounded-full
                   bg-white/50 backdrop-blur-sm border border-gray-100
                   hover:bg-white/70 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Mode icon */}
        <div className="text-gray-600">
          {currentMode.icon}
        </div>
        
        {/* Mode name */}
        <span className="text-xs font-light text-gray-700">
          {currentMode.name}
        </span>
        
        {/* Subtle indicator */}
        <motion.div
          className="w-0.5 h-0.5 rounded-full bg-gray-400"
          animate={{ opacity: isOpen ? 0 : 1 }}
        />
      </motion.button>
      
      {/* Clean dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 right-0 z-50
                       bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100
                       shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
            style={{ minWidth: '140px' }}
          >
            <div className="p-1">
              {modes.map((mode) => (
                <motion.button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-xl p-3 transition-all duration-200
                            ${selectedMode === mode.id 
                              ? 'bg-gray-50' 
                              : 'hover:bg-gray-50/50'}`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className={`transition-colors
                                   ${selectedMode === mode.id 
                                     ? 'text-gray-900' 
                                     : 'text-gray-500'}`}>
                      {mode.icon}
                    </div>
                    
                    {/* Name */}
                    <span className={`text-sm font-light transition-colors
                                    ${selectedMode === mode.id 
                                      ? 'text-gray-900' 
                                      : 'text-gray-600'}`}>
                      {mode.name}
                    </span>
                    
                    {/* Active indicator */}
                    {selectedMode === mode.id && (
                      <motion.div
                        className="w-1 h-1 rounded-full bg-gray-400 ml-auto"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      />
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}