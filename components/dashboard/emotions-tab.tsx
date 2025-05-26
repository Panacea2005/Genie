import { useState } from 'react'
import { motion } from 'framer-motion'
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
  PlusCircle
} from 'lucide-react'

interface Emotion {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  bgColor: string
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
      gradient: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      description: 'Peaceful and relaxed'
    },
    {
      id: 'happy',
      name: 'Happy',
      icon: Sun,
      gradient: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      description: 'Joyful and content'
    },
    {
      id: 'sad',
      name: 'Sad',
      icon: CloudRain,
      gradient: 'from-blue-400 to-indigo-500',
      bgColor: 'bg-blue-50',
      description: 'Down or melancholic'
    },
    {
      id: 'anxious',
      name: 'Anxious',
      icon: Zap,
      gradient: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-50',
      description: 'Worried or nervous'
    },
    {
      id: 'peaceful',
      name: 'Peaceful',
      icon: Waves,
      gradient: 'from-cyan-400 to-blue-500',
      bgColor: 'bg-cyan-50',
      description: 'Serene and tranquil'
    },
    {
      id: 'tired',
      name: 'Tired',
      icon: Moon,
      gradient: 'from-gray-400 to-slate-500',
      bgColor: 'bg-gray-50',
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 mb-2">How are you feeling?</h1>
        <p className="text-gray-500">Track your emotional well-being throughout the day</p>
      </div>

      {/* Emotion Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {emotions.map((emotion) => {
          const Icon = emotion.icon
          const isSelected = selectedEmotion === emotion.id
          
          return (
            <motion.button
              key={emotion.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleEmotionSelect(emotion.id)}
              className={`
                relative p-6 rounded-2xl border transition-all
                ${isSelected 
                  ? `${emotion.bgColor} border-gray-300` 
                  : 'bg-white border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl bg-gradient-to-br ${emotion.gradient} 
                flex items-center justify-center mb-3 mx-auto
              `}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-sm font-medium text-gray-900">{emotion.name}</div>
              <div className="text-xs text-gray-500 mt-1">{emotion.description}</div>
              
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-2 h-2 bg-gray-900 rounded-full"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Emotion Details */}
      {selectedEmotion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-8"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tell us more</h3>
          
          {/* Intensity Slider */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-700">Intensity</label>
              <span className="text-sm text-gray-500">{intensity}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${intensity * 10}%, #e5e7eb ${intensity * 10}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Intense</span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What's happening? Any triggers or thoughts?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
          >
            Save Entry
          </button>
        </motion.div>
      )}

      {/* Stats and Recent Entries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Today's Summary</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-2xl font-light text-gray-900">3 entries</div>
              <div className="text-sm text-gray-500">Average intensity: 6.3</div>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-gray-700">20% improvement from yesterday</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Entries</h3>
            <button className="text-gray-400 hover:text-gray-600">
              <PlusCircle className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-3">
            {recentEmotions.map((entry, index) => {
              const emotion = emotions.find(e => e.name === entry.emotion)
              const Icon = emotion?.icon || Heart
              
              return (
                <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className={`
                    w-10 h-10 rounded-lg bg-gradient-to-br ${emotion?.gradient || 'from-gray-400 to-gray-500'} 
                    flex items-center justify-center
                  `}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{entry.emotion}</span>
                      <span className="text-sm text-gray-500">• {entry.time}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-600"
                            style={{ width: `${(entry.intensity / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{entry.intensity}/10</span>
                      </div>
                    </div>
                    {entry.note && (
                      <p className="text-sm text-gray-600 mt-2">{entry.note}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Insights Card */}
      <div className="mt-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Weekly Insight</h4>
            <p className="text-sm text-gray-600">
              You've been feeling more calm this week compared to last week. 
              Your morning entries tend to be more positive. Keep up the great work!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}