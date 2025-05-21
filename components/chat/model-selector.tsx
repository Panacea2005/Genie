import { useState, useEffect, useRef } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
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
  
  // Essential model data with visual properties
  const models = [
    { 
      id: "llama3-70b-8192", 
      name: "Lyra", 
      icon: "✿",
      color: "from-indigo-400 to-purple-400",
      description: "Balanced & Creative"
    },
    { 
      id: "meta-llama/llama-4-maverick-17b-128e-instruct", 
      name: "Solace", 
      icon: "⦿",
      color: "from-purple-400 to-indigo-400",
      description: "Fast & Empathetic"
    }
  ];
  
  const currentModel = models.find(m => m.id === selectedModel) || models[0];
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: { target: any; }) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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
        {/* Model icon with gradient background */}
        <div className={`h-5 w-5 rounded-full bg-gradient-to-r ${currentModel.color} flex items-center justify-center text-white text-xs overflow-hidden relative`}>
          <motion.div
            animate={{ 
              rotate: 360 
            }}
            transition={{ 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute inset-0 opacity-30 bg-[radial-gradient(white,_transparent_60%)]"
          />
          <span className="relative z-10">{currentModel.icon}</span>
        </div>
        
        {/* Model name and chevron */}
        <div className="flex items-center gap-1.5">
          <span className="font-light">{currentModel.name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-500 transition-colors" />
        </div>
        
        {/* Subtle sparkles on hover */}
        <motion.div 
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
          animate={{ scale: [0.8, 1, 0.8], opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="w-3 h-3 text-indigo-300" />
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
            className={`absolute top-full mt-1 ${position === "right" ? "right-0" : "left-0"} bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden z-50`}
            style={{ width: '180px' }}
          >
            {/* Subtle header */}
            <div className="px-3 py-1.5 border-b border-gray-50 text-[10px] uppercase tracking-wider text-gray-400 font-medium">
              Select Model
            </div>
            
            <div className="py-1">
              {models.map((model) => (
                <motion.button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-gray-50 transition-colors`}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Model icon */}
                  <div className={`h-6 w-6 rounded-full bg-gradient-to-r ${model.color} flex items-center justify-center text-white text-xs relative ${selectedModel === model.id ? 'ring-1 ring-offset-1 ring-indigo-300' : ''}`}>
                    <span>{model.icon}</span>
                    
                    {/* Active indicator */}
                    {selectedModel === model.id && (
                      <motion.div 
                        className="absolute inset-0 rounded-full border-2 border-white"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </div>
                  
                  {/* Model info */}
                  <div className="flex flex-col">
                    <span className={`text-sm ${selectedModel === model.id ? "text-indigo-600 font-medium" : "text-gray-700"}`}>
                      {model.name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {model.description}
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

export default RefinedModelSelector;