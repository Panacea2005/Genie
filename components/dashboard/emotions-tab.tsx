import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flower2,
  Sun,
  CloudRain,
  Zap,
  Waves,
  Moon,
} from 'lucide-react'

interface Emotion {
  id: string
  name: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
}

interface EmotionEntry {
  emotion: string
  time: string
  intensity: number
  note?: string
}

export default function EmotionsTab() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [recentEmotions, setRecentEmotions] = useState<EmotionEntry[]>([
    { emotion: 'Calm', time: '2 hours ago', intensity: 7 },
    { emotion: 'Happy', time: '5 hours ago', intensity: 8 },
    { emotion: 'Anxious', time: 'Yesterday', intensity: 4 }
  ])

  const emotions: Emotion[] = [
    {
      id: 'calm',
      name: 'Calm',
      icon: Flower2,
      color: '#10b981', // emerald-500
    },
    {
      id: 'happy',
      name: 'Happy',
      icon: Sun,
      color: '#f59e0b', // amber-500
    },
    {
      id: 'sad',
      name: 'Sad',
      icon: CloudRain,
      color: '#3b82f6', // blue-500
    },
    {
      id: 'anxious',
      name: 'Anxious',
      icon: Zap,
      color: '#a855f7', // purple-500
    },
    {
      id: 'peaceful',
      name: 'Peaceful',
      icon: Waves,
      color: '#06b6d4', // cyan-500
    },
    {
      id: 'tired',
      name: 'Tired',
      icon: Moon,
      color: '#6b7280', // gray-500
    }
  ]

  const handleEmotionSelect = (emotionId: string) => {
    if (selectedEmotion === emotionId) {
      setSelectedEmotion(null)
      setShowForm(false)
    } else {
      setSelectedEmotion(emotionId)
      setShowForm(true)
    }
  }

  const handleSubmit = () => {
    if (selectedEmotion) {
      const emotion = emotions.find(e => e.id === selectedEmotion)
      setRecentEmotions([
        {
          emotion: emotion?.name || '',
          time: 'Just now',
          intensity,
          note: note.trim() || undefined
        },
        ...recentEmotions.slice(0, 4)
      ])
      
      // Reset form
      setSelectedEmotion(null)
      setIntensity(5)
      setNote('')
      setShowForm(false)
    }
  }

  const selectedEmotionData = emotions.find(e => e.id === selectedEmotion)

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        className="mb-16 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl font-light text-gray-800 mb-2">How are you feeling?</h1>
        <p className="text-gray-500 font-light text-sm">Select an emotion below</p>
      </motion.div>

      {/* Emotion Selection - Clean Grid */}
      <motion.div 
        className="grid grid-cols-3 md:grid-cols-6 gap-6 mb-16 max-w-3xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {emotions.map((emotion, index) => {
          const Icon = emotion.icon
          const isSelected = selectedEmotion === emotion.id
          
          return (
            <motion.button
              key={emotion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmotionSelect(emotion.id)}
              className="group flex flex-col items-center gap-3 focus:outline-none"
            >
              <motion.div
                className={`
                  w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center
                  transition-all duration-300 group-hover:shadow-lg
                  ${isSelected ? 'shadow-xl scale-105' : 'shadow-md'}
                `}
                style={{
                  borderWidth: isSelected ? '2px' : '1px',
                  borderColor: isSelected ? emotion.color : '#f3f4f6'
                }}
              >
                <Icon 
                  className="w-8 h-8 md:w-10 md:h-10 transition-all duration-300" 
                  color={emotion.color}
                  strokeWidth={isSelected ? 2 : 1.5}
                />
              </motion.div>
              <span className={`
                text-xs font-light transition-all duration-300
                ${isSelected ? 'text-gray-800 font-normal' : 'text-gray-600'}
              `}>
                {emotion.name}
              </span>
            </motion.button>
          )
        })}
      </motion.div>

      {/* Emotion Form - Elegant Slide Down */}
      <AnimatePresence>
        {showForm && selectedEmotionData && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-16 overflow-hidden"
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
              {/* Form Header */}
              <div className="flex items-center gap-3 mb-8">
                <selectedEmotionData.icon 
                  className="w-6 h-6" 
                />
                <h3 className="text-lg font-light text-gray-800">
                  Feeling {selectedEmotionData.name.toLowerCase()}
                </h3>
              </div>
              
              {/* Intensity Slider - Minimal */}
              <div className="mb-8">
                <label className="text-sm font-light text-gray-600 mb-4 block">
                  Intensity level
                </label>
                <div className="relative px-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-0.5 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${selectedEmotionData.color} 0%, ${selectedEmotionData.color} ${intensity * 10}%, #e5e7eb ${intensity * 10}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs font-light text-gray-400 mt-3">
                    <span>1</span>
                    <span>5</span>
                    <span>10</span>
                  </div>
                </div>
              </div>

              {/* Notes - Clean Textarea */}
              <div className="mb-8">
                <label className="text-sm font-light text-gray-600 mb-3 block">
                  Notes (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Any thoughts you'd like to add..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-all resize-none font-light text-gray-700 placeholder-gray-400 text-sm"
                  rows={3}
                />
              </div>

              {/* Action Button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all font-light text-sm"
              >
                Save Check-in
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Entries - Clean List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <h2 className="text-lg font-light text-gray-800 mb-6 text-center">Recent check-ins</h2>
        
        <div className="space-y-2">
          {recentEmotions.map((entry, index) => {
            const emotion = emotions.find(e => e.name === entry.emotion)
            const Icon = emotion?.icon || Flower2
            
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Icon 
                      className="w-5 h-5" 
                      style={{ color: emotion?.color }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-light text-gray-800">{entry.emotion}</span>
                      <span className="text-gray-300">·</span>
                      <span className="font-light text-gray-500">{entry.time}</span>
                    </div>
                    {entry.note && (
                      <p className="text-xs font-light text-gray-500 mt-1 truncate">{entry.note}</p>
                    )}
                  </div>
                  
                  {/* Intensity */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 h-3 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i < entry.intensity ? emotion?.color : '#f3f4f6',
                          opacity: i < entry.intensity ? 1 : 0.5
                        }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 12px;
          height: 12px;
          background: ${selectedEmotionData?.color || '#6b7280'};
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }
        
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        .slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: ${selectedEmotionData?.color || '#6b7280'};
          border: none;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }
        
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </div>
  )
}