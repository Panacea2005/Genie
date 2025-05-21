// components/EmotionSelector.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Emotion {
  name: string;
  emoji: string;
  color: string;
  description?: string;
}

const emotions: Emotion[] = [
  { name: 'Calm', emoji: '😌', color: '#B3D89C', description: 'Peaceful and at ease' },
  { name: 'Happy', emoji: '😊', color: '#FFD166', description: 'Feeling joy or contentment' },
  { name: 'Sad', emoji: '😔', color: '#7C9EB2', description: 'Experiencing sadness or disappointment' },
  { name: 'Anxious', emoji: '😰', color: '#C0D6DF', description: 'Feeling worry or unease' },
  { name: 'Angry', emoji: '😠', color: '#FF6B6B', description: 'Experiencing frustration or irritation' },
  { name: 'Overwhelmed', emoji: '😩', color: '#9381FF', description: 'Feeling burdened or stressed' },
  { name: 'Tired', emoji: '😴', color: '#8A817C', description: 'Low energy or exhausted' },
  { name: 'Hopeful', emoji: '🙂', color: '#87BCDE', description: 'Optimistic about the future' }
];

interface EmotionSelectorProps {
  onSelect: (emotion: Emotion, intensity?: number) => void;
  showIntensity?: boolean;
  className?: string;
}

export default function EmotionSelector({ 
  onSelect, 
  showIntensity = true, 
  className = '' 
}: EmotionSelectorProps) {
  const [selected, setSelected] = useState<Emotion | null>(null);
  const [intensity, setIntensity] = useState<number>(5);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  
  const handleSelect = (emotion: Emotion) => {
    setSelected(emotion);
    setShowDetails(true);
    if (!showIntensity) {
      onSelect(emotion);
    }
  };
  
  const handleConfirm = () => {
    if (selected) {
      onSelect(selected, intensity);
      setShowDetails(false);
    }
  };
  
  return (
    <div className={`my-4 ${className}`}>
      <h3 className="text-sm text-gray-500 mb-2">How are you feeling today?</h3>
      
      <div className="flex flex-wrap gap-2">
        {emotions.map((emotion) => (
          <motion.button
            key={emotion.name}
            onClick={() => handleSelect(emotion)}
            className={`rounded-full flex items-center gap-1 px-3 py-1.5 text-sm transition-all`}
            style={{ 
              backgroundColor: selected?.name === emotion.name 
                ? `${emotion.color}` 
                : `${emotion.color}40`,
              border: selected?.name === emotion.name
                ? '1px solid rgba(0,0,0,0.1)'
                : '1px solid transparent'
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>{emotion.emoji}</span>
            <span>{emotion.name}</span>
          </motion.button>
        ))}
      </div>
      
      {/* Intensity slider for selected emotion */}
      {showIntensity && showDetails && selected && (
        <motion.div 
          className="mt-4 bg-white/80 p-4 rounded-lg border border-gray-100"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">{selected.emoji}</span>
            <span className="font-medium">{selected.name}</span>
          </div>
          
          {selected.description && (
            <p className="text-sm text-gray-600 mb-3">{selected.description}</p>
          )}
          
          <div className="mb-4">
            <label className="block text-sm text-gray-500 mb-2">
              How intense is this feeling? ({intensity}/10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full"
              style={{
                accentColor: selected.color,
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Strong</span>
            </div>
          </div>
          
          <div className="flex justify-end">
            <motion.button
              onClick={() => setShowDetails(false)}
              className="px-3 py-1.5 text-sm text-gray-500 mr-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
            
            <motion.button
              onClick={handleConfirm}
              className="px-3 py-1.5 text-sm text-white rounded-md"
              style={{ backgroundColor: selected.color }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Confirm
            </motion.button>
          </div>
        </motion.div>
      )}
    </div>
  );
}