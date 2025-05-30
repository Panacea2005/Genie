import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  position?: "left" | "right";
}

const ModelSelector = ({ 
  selectedModel, 
  setSelectedModel,
  position = "left"
}: ModelSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const models = [
    { 
      id: "llama3-70b-8192", 
      name: "Lyra",
      tone: "#818cf8"
    },
    { 
      id: "meta-llama/llama-4-maverick-17b-128e-instruct", 
      name: "Solace",
      tone: "#a78bfa"
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
      {/* Ultra-minimal trigger */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative group flex items-center gap-2 py-1.5 px-3 rounded-full 
                   bg-white/50 backdrop-blur-sm border border-gray-100
                   hover:bg-white/70 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Subtle color dot */}
        <motion.div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: currentModel.tone }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        
        {/* Model name */}
        <span className="text-xs font-light text-gray-700">
          {currentModel.name}
        </span>
        
        {/* Minimal chevron */}
        <motion.div 
          className="w-3 h-3 ml-1"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg viewBox="0 0 12 12" fill="none">
            <path 
              d="M3 4.5L6 7.5L9 4.5" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-gray-400"
            />
          </svg>
        </motion.div>
      </motion.button>
      
      {/* Ethereal dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full mt-1 ${position === "right" ? "right-0" : "left-0"} z-50
                       bg-white/90 backdrop-blur-md rounded-2xl border border-gray-100
                       shadow-[0_8px_30px_rgba(0,0,0,0.04)]`}
            style={{ minWidth: '160px' }}
          >
            <div className="p-1">
              {models.map((model) => (
                <motion.button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left rounded-xl p-3 transition-all duration-200
                            ${selectedModel === model.id 
                              ? 'bg-gray-50' 
                              : 'hover:bg-gray-50/50'}`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    {/* Model color */}
                    <div className="relative">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: model.tone }}
                      />
                      {selectedModel === model.id && (
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          initial={{ scale: 1 }}
                          animate={{ scale: 2, opacity: 0 }}
                          transition={{ duration: 0.4 }}
                          style={{ 
                            backgroundColor: model.tone,
                            opacity: 0.2
                          }}
                        />
                      )}
                    </div>
                    
                    {/* Model name */}
                    <span className={`text-sm font-light transition-colors
                                    ${selectedModel === model.id 
                                      ? 'text-gray-900' 
                                      : 'text-gray-600'}`}>
                      {model.name}
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
};

export default ModelSelector;