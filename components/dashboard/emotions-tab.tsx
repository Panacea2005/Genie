import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { 
  EmotionService, 
  EmotionType, 
  EmotionEntry,
  CreateEmotionEntry 
} from '@/lib/services/emotionService'
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
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react'

// Icon mapping for emotion types
const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  'Flower2': Flower2,
  'Sun': Sun,
  'CloudRain': CloudRain,
  'Zap': Zap,
  'Waves': Waves,
  'Moon': Moon,
  'Star': Star,
  'Heart': Heart
}

export default function EmotionsTab() {
  const { user } = useAuth()
  
  // State management
  const [emotionTypes, setEmotionTypes] = useState<EmotionType[]>([])
  const [recentEmotions, setRecentEmotions] = useState<EmotionEntry[]>([])
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [note, setNote] = useState('')
  
  // Loading and error states
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Statistics state
  const [todayStats, setTodayStats] = useState({
    entries: 0,
    avgIntensity: 0,
    comparisonText: 'Loading...'
  })
  
  // Weekly insights state
  const [weeklyInsights, setWeeklyInsights] = useState({
    thisWeekEntries: 0,
    lastWeekEntries: 0,
    thisWeekAvgIntensity: 0,
    lastWeekAvgIntensity: 0,
    weeklyComparison: 'Loading...',
    weeklyInsight: 'Loading weekly insights...'
  })

  // Load emotion types and recent entries on component mount
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load emotion types and recent entries in parallel
        const [typesResult, entriesResult, insightsResult, weeklyInsightsResult] = await Promise.all([
          EmotionService.getEmotionTypes(),
          EmotionService.getEmotionEntries(user.id, 5),
          EmotionService.getEmotionInsights(user.id),
          EmotionService.getWeeklyEmotionInsights(user.id)
        ])

        if (typesResult.error) {
          throw new Error('Failed to load emotion types')
        }
        if (entriesResult.error) {
          throw new Error('Failed to load recent emotions')
        }

        setEmotionTypes(typesResult.data || [])
        setRecentEmotions(entriesResult.data || [])
        
        // Update today's stats
        setTodayStats({
          entries: insightsResult.todayEntries,
          avgIntensity: insightsResult.avgIntensity,
          comparisonText: insightsResult.comparisonText
        })
        
        // Update weekly insights
        setWeeklyInsights({
          thisWeekEntries: weeklyInsightsResult.thisWeekEntries,
          lastWeekEntries: weeklyInsightsResult.lastWeekEntries,
          thisWeekAvgIntensity: weeklyInsightsResult.thisWeekAvgIntensity,
          lastWeekAvgIntensity: weeklyInsightsResult.lastWeekAvgIntensity,
          weeklyComparison: weeklyInsightsResult.weeklyComparison,
          weeklyInsight: weeklyInsightsResult.weeklyInsight
        })

      } catch (err: any) {
        console.error('Error loading emotion data:', err)
        setError(err.message || 'Failed to load emotion data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId)
  }

  const handleSubmit = async () => {
    if (!selectedEmotion || !user?.id || submitting) return

    try {
      setSubmitting(true)
      setError(null)

      const entryData: CreateEmotionEntry = {
        emotion_type_id: selectedEmotion,
        intensity,
        notes: note.trim() || null
      }

      const { data: newEntry, error: submitError } = await EmotionService.createEmotionEntry(user.id, entryData)
      
      if (submitError) {
        throw new Error('Failed to save emotion entry')
      }

      if (newEntry) {
        // Add new entry to the beginning of recent emotions
        setRecentEmotions([newEntry, ...recentEmotions.slice(0, 4)])
        
        // Update today's stats
        setTodayStats(prev => ({
          ...prev,
          entries: prev.entries + 1,
          avgIntensity: prev.entries === 0 ? intensity : 
            ((prev.avgIntensity * prev.entries) + intensity) / (prev.entries + 1)
        }))
      }
      
      // Reset form
      setSelectedEmotion(null)
      setIntensity(5)
      setNote('')
      
    } catch (err: any) {
      console.error('Error submitting emotion:', err)
      setError(err.message || 'Failed to save emotion')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 font-light">Loading your emotion data...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <h3 className="text-red-800 font-medium mb-2">Unable to load emotions</h3>
          <p className="text-red-600 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Emotion Grid - Minimal cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
        {emotionTypes.map((emotion, index) => {
          const Icon = iconMap[emotion.icon_name] || Heart
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
                      background: `linear-gradient(to right, ${emotionTypes.find(e => e.id === selectedEmotion)?.color} 0%, ${emotionTypes.find(e => e.id === selectedEmotion)?.color} ${intensity * 10}%, #e5e7eb ${intensity * 10}%, #e5e7eb 100%)`
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

              {/* Error Message */}
              {error && (
                <motion.div 
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 text-sm">{error}</p>
                </motion.div>
              )}

              {/* Submit Button - Minimal style */}
              <motion.button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-light hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                whileHover={{ scale: submitting ? 1 : 1.01 }}
                whileTap={{ scale: submitting ? 1 : 0.99 }}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Saving...' : 'Save this moment'}
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
                {todayStats.entries} {todayStats.entries === 1 ? 'entry' : 'entries'}
              </motion.div>
              <div className="text-sm text-gray-500 font-light">
                {todayStats.entries > 0 
                  ? `Average intensity: ${todayStats.avgIntensity.toFixed(1)}`
                  : 'No entries today yet'
                }
              </div>
            </div>
            
            <div className="pt-5 border-t border-gray-200/30">
              <motion.div 
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-gray-600 font-light">{todayStats.comparisonText}</span>
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
              const emotion = emotionTypes.find(e => e.id === entry.emotion_type_id)
              const Icon = (emotion ? iconMap[emotion.icon_name] : null) || Heart
              
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
                      <span className="font-medium text-gray-800">{emotion?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-500 font-light">• {EmotionService.formatRelativeTime(entry.created_at)}</span>
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
                    {entry.notes && (
                      <p className="text-sm text-gray-600 mt-2 font-light">{entry.notes}</p>
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
              {weeklyInsights.weeklyInsight}
            </p>
            {weeklyInsights.thisWeekEntries > 0 && (
              <div className="mt-3 text-xs text-gray-500 font-light">
                {weeklyInsights.thisWeekEntries} entries this week • {weeklyInsights.weeklyComparison}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}