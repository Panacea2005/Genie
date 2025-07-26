"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SearchBar({ prompt = "A nearby place to unwind, like my trip to Tahoe", onExpand }: { prompt?: string; onExpand: () => void }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(prompt);
  const [isFocused, setIsFocused] = useState(false);

  // Update when prompt changes
  useEffect(() => {
    setIsTransitioning(true);
    
    // Fade out current prompt
    setTimeout(() => {
      setCurrentPrompt(prompt);
      setIsTransitioning(false);
    }, 300);
  }, [prompt]);

  return (
    <div className="w-full max-w-[400px] sm:max-w-[500px] relative mx-auto">
      <motion.div
        className={`w-full flex items-center bg-white/90 backdrop-blur-sm border ${isFocused ? 'border-gray-300' : 'border-gray-100'} 
          rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-1 ${isFocused ? 'shadow-md' : 'shadow-sm'} transition-all duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        whileHover={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)" }}
      >
        {/* Mini Gradient Sphere Icon - responsive */}
        <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center mr-2 sm:mr-3 rounded-full overflow-hidden">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200" 
               style={{ 
                 boxShadow: "inset 0 0 4px rgba(255, 255, 255, 0.8)",
                 filter: "blur(0.5px)"
               }}>
            <div className="w-5 h-5 sm:w-6 sm:h-6 absolute top-0 left-0 rounded-full bg-gradient-to-tl from-transparent via-white/30 to-transparent opacity-70" />
          </div>
        </div>
        
        {/* Search input with prompt text - responsive typography */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPrompt}
            className="flex-1 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="text"
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              className="w-full outline-none text-xs sm:text-sm text-gray-600 font-light bg-transparent placeholder:text-gray-400"
              placeholder="Ask Genie..."
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </motion.div>
        </AnimatePresence>
        
        {/* Elegant action button - responsive sizing */}
        <motion.button
          className={`ml-2 ${isFocused ? 'bg-black' : 'bg-gray-900'} text-white rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center transition-colors duration-300`}
          whileHover={{ scale: 1.05, backgroundColor: "#000" }}
          whileTap={{ scale: 0.95 }}
          onClick={onExpand}
        >
          <motion.svg 
            width="14" 
            height="14" 
            className="sm:w-4 sm:h-4"
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <path d="M12 4L12 20M20 12L4 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </motion.svg>
        </motion.button>
      </motion.div>
      
      {/* Minimalist position indicator - responsive spacing */}
      <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1.5 sm:space-x-2">
        {[0, 1, 2, 3].map((dot, i) => (
          <motion.div 
            key={i}
            className={`h-0.5 rounded-full transition-all duration-300 ${
              // Highlight the dot that corresponds to the current prompt
              prompt.includes("nearby") && i === 0 ? "bg-gray-400" :
              prompt.includes("restaurant") && i === 1 ? "bg-gray-400" :
              prompt.includes("Alex") && i === 2 ? "bg-gray-400" :
              prompt.includes("article") && i === 3 ? "bg-gray-400" :
              "bg-gray-200"
            }`}
            animate={{ 
              width: (prompt.includes("nearby") && i === 0) || 
                     (prompt.includes("restaurant") && i === 1) || 
                     (prompt.includes("Alex") && i === 2) || 
                     (prompt.includes("article") && i === 3) 
                ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 16)
                : 4
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          />
        ))}
      </div>
    </div>
  );
}