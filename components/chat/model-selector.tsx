import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RefinedModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  position?: "left" | "right";
}

const RefinedModelSelector = ({ 
  selectedModel, 
  setSelectedModel,
  position = "left"
}: RefinedModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Model data with refined visual properties
  const models = [
    { 
      id: "llama3-70b-8192", 
      name: "Lyra", 
      symbol: "◈",
      gradient: { from: "#818cf8", to: "#c084fc" },
      glow: "rgba(139, 92, 246, 0.3)",
      description: "Balanced & Creative"
    },
    { 
      id: "meta-llama/llama-4-maverick-17b-128e-instruct", 
      name: "Solace", 
      symbol: "◉",
      gradient: { from: "#a78bfa", to: "#e879f9" },
      glow: "rgba(217, 70, 239, 0.3)",
      description: "Fast & Empathetic"
    }
  ];
  
  const currentModel = models.find(m => m.id === selectedModel) || models[0];
  
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
      {/* Ultra-minimal selector */}
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
        {/* Animated gradient orb */}
        <div className="relative">
          <motion.div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${currentModel.gradient.from}, ${currentModel.gradient.to})`,
              boxShadow: `0 0 20px ${currentModel.glow}`
            }}
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <span className="text-white text-xs font-light relative z-10">
              {currentModel.symbol}
            </span>
          </motion.div>
          
          {/* Glow pulse */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${currentModel.glow}, transparent)`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </div>
        
        {/* Model name with elegant typography */}
        <span className="text-sm font-light text-gray-700 tracking-wide">
          {currentModel.name}
        </span>
        
        {/* Custom animated chevron */}
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
      
      {/* Ethereal dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop blur */}
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
              className={`absolute top-full mt-2 ${position === "right" ? "right-0" : "left-0"} z-50`}
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                minWidth: '240px'
              }}
            >
              {/* Glass effect overlay */}
              <div className="absolute inset-0 rounded-[20px] bg-gradient-to-b from-white/50 to-white/0 pointer-events-none" />
              
              <div className="relative p-2">
                {models.map((model, index) => (
                  <motion.button
                    key={model.id}
                    onClick={() => {
                      setSelectedModel(model.id);
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
                      {/* Model orb */}
                      <div className="relative">
                        <motion.div
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${model.gradient.from}, ${model.gradient.to})`,
                            boxShadow: selectedModel === model.id 
                              ? `0 0 24px ${model.glow}` 
                              : `0 0 12px ${model.glow}`
                          }}
                          animate={selectedModel === model.id ? {
                            scale: [1, 1.05, 1],
                          } : {}}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        >
                          <span className="text-white text-sm font-light">
                            {model.symbol}
                          </span>
                        </motion.div>
                        
                        {/* Selection ring */}
                        {selectedModel === model.id && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.2, opacity: [0, 0.3, 0] }}
                            transition={{ duration: 1 }}
                            style={{
                              border: `2px solid ${model.gradient.from}`,
                            }}
                          />
                        )}
                      </div>
                      
                      {/* Model details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm transition-all duration-300 ${
                            selectedModel === model.id 
                              ? "text-gray-900 font-medium" 
                              : "text-gray-700"
                          }`}>
                            {model.name}
                          </span>
                          {selectedModel === model.id && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="text-xs px-2 py-0.5 rounded-full text-white"
                              style={{ 
                                background: `linear-gradient(135deg, ${model.gradient.from}, ${model.gradient.to})` 
                              }}
                            >
                              Active
                            </motion.span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 mt-0.5 block">
                          {model.description}
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
};

export default RefinedModelSelector;