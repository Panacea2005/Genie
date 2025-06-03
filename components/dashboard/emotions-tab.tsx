import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flower2,
  Sun,
  CloudRain,
  Zap,
  Waves,
  Moon,
  Star,
  Heart,
  Sparkles,
  TrendingUp,
  Calendar,
  PlusCircle,
  ChevronRight
} from 'lucide-react'

interface Emotion {
  id: string
  name: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  color: string
  description: string
}

export default function EmotionsTab() {
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  const [recentEmotions, setRecentEmotions] = useState<any[]>([
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
      description: 'Peaceful and relaxed'
    },
    {
      id: 'happy',
      name: 'Happy',
      icon: Sun,
      color: '#f59e0b', // amber-500
      description: 'Joyful and content'
    },
    {
      id: 'sad',
      name: 'Sad',
      icon: CloudRain,
      color: '#3b82f6', // blue-500
      description: 'Down or melancholic'
    },
    {
      id: 'anxious',
      name: 'Anxious',
      icon: Zap,
      color: '#a855f7', // purple-500
      description: 'Worried or nervous'
    },
    {
      id: 'peaceful',
      name: 'Peaceful',
      icon: Waves,
      color: '#06b6d4', // cyan-500
      description: 'Serene and tranquil'
    },
    {
      id: 'tired',
      name: 'Tired',
      icon: Moon,
      color: '#6b7280', // gray-500
      description: 'Low energy or exhausted'
    }
  ]

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId)
  }

  const handleSubmit = () => {
    if (selectedEmotion) {
      const emotion = emotions.find(e => e.id === selectedEmotion)
      setRecentEmotions([
        {
          emotion: emotion?.name,
          time: 'Just now',
          intensity,
          note
        },
        ...recentEmotions.slice(0, 2)
      ])
      
      // Reset form
      setSelectedEmotion(null)
      setIntensity(5)
      setNote('')
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Emotion Grid - Minimal cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
        {emotions.map((emotion, index) => {
          const Icon = emotion.icon
          const isSelected = selectedEmotion === emotion.id
          
          return (
            <motion.button
              key={emotion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleEmotionSelect(emotion.id)}
              className={`
                relative p-6 rounded-2xl transition-all duration-300
                ${isSelected 
                  ? 'bg-white/60 backdrop-blur-sm border border-gray-200 shadow-lg' 
                  : 'bg-white/30 backdrop-blur-sm border border-white/40 hover:bg-white/50 hover:border-white/60'
                }
              `}
            >
              {/* Animated selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-gray-800 rounded-full"
                  />
                )}
              </AnimatePresence>
              
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Icon 
                  className="w-8 h-8 mx-auto mb-3 transition-colors duration-300" 
                  style={{ color: isSelected ? emotion.color : '#9ca3af' }}
                />
              </motion.div>
              <div className={`text-sm font-medium transition-colors duration-300 ${
                isSelected ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {emotion.name}
              </div>
              <div className="text-xs text-gray-500 mt-1 opacity-80">{emotion.description}</div>
            </motion.button>
          )
        })}
      </div>

      {/* Emotion Details - Minimal form */}
      <AnimatePresence mode="wait">
        {selectedEmotion && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 p-8 mb-12"
          >
            <div className="max-w-2xl mx-auto">
              {/* Intensity Slider - Minimal design */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-light text-gray-700">How intense is this feeling?</label>
                  <span className="text-sm text-gray-600 font-light">{intensity}/10</span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={intensity}
                    onChange={(e) => setIntensity(parseInt(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, ${emotions.find(e => e.id === selectedEmotion)?.color} 0%, ${emotions.find(e => e.id === selectedEmotion)?.color} ${intensity * 10}%, #e5e7eb ${intensity * 10}%, #e5e7eb 100%)`
                    }}
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-light">
                    <span>Mild</span>
                    <span>Moderate</span>
                    <span>Intense</span>
                  </div>
                </div>
              </div>

              {/* Notes - Minimal textarea */}
              <div className="mb-8">
                <label className="block text-sm font-light text-gray-700 mb-3">
                  Would you like to add any thoughts?
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's on your mind? (optional)"
                  className="w-full px-5 py-4 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl focus:outline-none focus:border-gray-300 transition-all resize-none placeholder-gray-400 text-gray-700"
                  rows={3}
                />
              </div>

              {/* Submit Button - Minimal style */}
              <motion.button
                onClick={handleSubmit}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-light hover:bg-gray-800 transition-all"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Save this moment
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats and Recent Entries - Minimal cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Summary - Minimal card */}
        <motion.div 
          className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-light text-gray-800">Today's Journey</h3>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="space-y-5">
            <div>
              <motion.div 
                className="text-3xl font-light text-gray-900"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                3 entries
              </motion.div>
              <div className="text-sm text-gray-500 font-light">Average intensity: 6.3</div>
            </div>
            
            <div className="pt-5 border-t border-gray-200/30">
              <motion.div 
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600 font-light">Feeling 20% better than yesterday</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Recent Entries - Minimal list */}
        <motion.div 
          className="lg:col-span-2 bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-light text-gray-800">Recent Moments</h3>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentEmotions.map((entry, index) => {
              const emotion = emotions.find(e => e.name === entry.emotion)
              const Icon = emotion?.icon || Heart
              
              return (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-4 p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/30 transition-all cursor-pointer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ x: 5 }}
                >
                  <Icon 
                    className="w-5 h-5 flex-shrink-0" 
                    style={{ color: emotion?.color || '#9ca3af' }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{entry.emotion}</span>
                      <span className="text-xs text-gray-500 font-light">• {entry.time}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${(entry.intensity / 10) * 100}%`,
                              backgroundColor: emotion?.color || '#9ca3af'
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(entry.intensity / 10) * 100}%` }}
                            transition={{ duration: 0.5, delay: 0.2 * index }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-light">{entry.intensity}</span>
                      </div>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-gray-600 mt-2 font-light">{entry.note}</p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Insights Card - Minimal design */}
      <motion.div 
        className="mt-6 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-4">
          <motion.div
            animate={{ 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </motion.div>
          <div>
            <h4 className="font-medium text-gray-800 mb-1">Weekly Insight</h4>
            <p className="text-sm text-gray-600 font-light leading-relaxed">
              You've been feeling more calm this week compared to last week. 
              Your morning entries tend to be more positive. Keep up the great work!
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}