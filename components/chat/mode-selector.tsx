// components/chat/mode-selector.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Phone, ChevronDown, Sparkles } from "lucide-react";

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
      icon: "💬",
      color: "from-indigo-400 to-purple-400",
      description: "Text conversation",
    },
    {
      id: "speech" as const,
      name: "Voice",
      icon: "🎙",
      color: "from-purple-400 to-pink-400",
      description: "Voice conversation",
    },
  ];

  const currentMode = modes.find((m) => m.id === selectedMode)!;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Refined elegant selector button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-2 py-1.5 px-3 rounded-md backdrop-blur-sm text-gray-700 hover:text-gray-900 transition-all border border-transparent hover:border-gray-200 hover:bg-white/60"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Mode icon with gradient background */}
        <div className={`h-5 w-5 rounded-full bg-gradient-to-r ${currentMode.color} flex items-center justify-center text-white text-xs overflow-hidden relative`}>
          <motion.div
            animate={{ 
              rotate: selectedMode === "speech" ? [0, 10, -10, 0] : 0
            }}
            transition={{ 
              duration: 2, 
              repeat: selectedMode === "speech" ? Infinity : 0,
              ease: "easeInOut" 
            }}
            className="absolute inset-0 opacity-30 bg-[radial-gradient(white,_transparent_60%)]"
          />
          <span className="relative z-10 text-[10px]">{currentMode.icon}</span>
        </div>
        
        {/* Mode name and chevron */}
        <div className="flex items-center gap-1.5">
          <span className="font-light">{currentMode.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500 transition-all ${isOpen ? 'rotate-180' : ''}`} />
        </div>
        
        {/* Subtle sparkles on hover */}
        <motion.div 
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ scale: [0.8, 1, 0.8], opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-3 h-3 text-purple-300" />
        </motion.div>
      </motion.button>
      
      {/* Elegant dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full mt-1 right-0 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden z-50"
            style={{ width: '160px' }}
          >
            {/* Subtle header */}
            <div className="px-3 py-1.5 border-b border-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              Select Mode
            </div>
            
            <div className="py-1">
              {modes.map((mode) => (
                <motion.button
                  key={mode.id}
                  onClick={() => {
                    onModeChange(mode.id);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors"
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Mode icon */}
                  <div className={`h-6 w-6 rounded-full bg-gradient-to-r ${mode.color} flex items-center justify-center text-white text-xs relative ${selectedMode === mode.id ? 'ring-1 ring-offset-1 ring-purple-300' : ''}`}>
                    <span className="text-[11px]">{mode.icon}</span>
                    
                    {/* Active indicator */}
                    {selectedMode === mode.id && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  {/* Mode info */}
                  <div className="flex flex-col">
                    <span className={`text-sm ${selectedMode === mode.id ? "text-purple-600 font-medium" : "text-gray-700"}`}>
                      {mode.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {mode.description}
                    </span>
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