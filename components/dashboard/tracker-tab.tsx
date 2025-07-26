import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/app/contexts/AuthContext'
import { 
  EmotionService, 
  EmotionEntry,
  EmotionType 
} from '@/lib/services/emotionService'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Download,
  BarChart3,
  LineChart,
  PieChart,
  Target,
  Award,
  Clock,
  Activity,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Zap,
  Heart,
  Flower2,
  Waves,
  Info,
  X,
  Circle,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface DayData {
  date: Date
  entries: EmotionEntry[]
}

// Icon mapping for emotion types
const emotionIconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  'Flower2': Flower2,
  'Sun': Sun,
  'CloudRain': CloudRain,
  'Zap': Zap,
  'Waves': Waves,
  'Moon': Moon,
  'Star': Heart, // Fallback for any new icons
  'Heart': Heart
}

export default function TrackerTab() {
  const { user } = useAuth()
  
  // State management
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedDayEntries, setSelectedDayEntries] = useState<EmotionEntry[]>([])
  
  // Data state
  const [emotionEntries, setEmotionEntries] = useState<EmotionEntry[]>([])
  const [emotionTypes, setEmotionTypes] = useState<EmotionType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load emotion data on component mount
  useEffect(() => {
    if (!user?.id) return

    const loadEmotionData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get emotion types and recent entries (last 60 days for good tracking view)
        const [typesResult, entriesResult] = await Promise.all([
          EmotionService.getEmotionTypes(),
          EmotionService.getEmotionEntries(user.id, 100) // Get more entries for better tracking
        ])

        if (typesResult.error) {
          throw new Error('Failed to load emotion types')
        }
        if (entriesResult.error) {
          throw new Error('Failed to load emotion entries')
        }

        setEmotionTypes(typesResult.data || [])
        setEmotionEntries(entriesResult.data || [])
      } catch (err: any) {
        console.error('Error loading emotion data:', err)
        setError(err.message || 'Failed to load emotion data')
      } finally {
        setLoading(false)
      }
    }

    loadEmotionData()
  }, [user?.id])

  // Create icon and color maps from emotion types
  const moodIcons = emotionTypes.reduce((acc, type) => {
    acc[type.name] = emotionIconMap[type.icon_name] || Heart
    return acc
  }, {} as { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> })

  const moodColors = emotionTypes.reduce((acc, type) => {
    acc[type.name] = type.color
    return acc
  }, {} as { [key: string]: string })

  const getMoodStats = () => {
    if (emotionEntries.length === 0) {
      return {
        average: '0.0',
        trend: 'stable' as const,
        trendValue: 0,
        topMood: 'No data',
        topMoodCount: 0,
        totalEntries: 0,
        streakDays: 0,
        improvement: 0
      }
    }

    const avgIntensity = emotionEntries.reduce((sum, entry) => sum + entry.intensity, 0) / emotionEntries.length
    
    // Calculate trend (compare last 7 days with previous 7 days)
    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const recentEntries = emotionEntries.filter(entry => new Date(entry.created_at) >= lastWeek)
    const previousEntries = emotionEntries.filter(entry => 
      new Date(entry.created_at) >= twoWeeksAgo && new Date(entry.created_at) < lastWeek
    )
    
    const recentAvg = recentEntries.length > 0 
      ? recentEntries.reduce((sum, entry) => sum + entry.intensity, 0) / recentEntries.length 
      : avgIntensity
    
    const previousAvg = previousEntries.length > 0 
      ? previousEntries.reduce((sum, entry) => sum + entry.intensity, 0) / previousEntries.length 
      : avgIntensity
    
    const trendDiff = recentAvg - previousAvg
    
    // Find most common emotion
    const emotionCounts = emotionEntries.reduce((acc, entry) => {
      const emotionName = entry.emotion_type?.name || 'Unknown'
      acc[emotionName] = (acc[emotionName] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    const topMood = Object.entries(emotionCounts).sort(([,a], [,b]) => b - a)[0]
    
    // Calculate streak (consecutive days with entries)
    const entriesByDate = emotionEntries.reduce((acc, entry) => {
      const date = new Date(entry.created_at).toDateString()
      acc[date] = true
      return acc
    }, {} as { [key: string]: boolean })
    
    let streakDays = 0
    const today = new Date()
    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      if (entriesByDate[checkDate.toDateString()]) {
        streakDays++
      } else {
        break
      }
    }
    
    const improvement = trendDiff > 0 ? Math.round((trendDiff / previousAvg) * 100) : 0
    
    return {
      average: avgIntensity.toFixed(1),
      trend: trendDiff > 0.5 ? 'up' : trendDiff < -0.5 ? 'down' : 'stable',
      trendValue: Math.abs(Math.round(trendDiff * 10) / 10),
      topMood: topMood?.[0] || 'Unknown',
      topMoodCount: topMood?.[1] || 0,
      totalEntries: emotionEntries.length,
      streakDays,
      improvement: Math.max(0, improvement)
    }
  }

  const stats = getMoodStats()

  // Get calendar days for the current month
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: DayData[] = []
    
    // Add empty days from previous month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: new Date(year, month, -startingDayOfWeek + i + 1), entries: [] })
    }
    
    // Add days of current month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i)
      const dateStr = date.toISOString().split('T')[0]
      const entries = emotionEntries.filter(entry => {
        const entryDate = new Date(entry.created_at).toISOString().split('T')[0]
        return entryDate === dateStr
      })
      days.push({ date, entries })
    }
    
    // Add empty days from next month
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), entries: [] })
    }
    
    return days
  }

  const handleDateClick = (dayData: DayData) => {
    if (dayData.entries.length > 0) {
      setSelectedDayEntries(dayData.entries)
      setSelectedDate(dayData.date)
      setShowDetailModal(true)
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  // Get distribution data for pie chart
  const getDistributionData = () => {
    if (emotionEntries.length === 0) {
      return []
    }
    
    const distribution = emotionEntries.reduce((acc, entry) => {
      const emotionName = entry.emotion_type?.name || 'Unknown'
      acc[emotionName] = (acc[emotionName] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    return Object.entries(distribution).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / emotionEntries.length) * 100)
    }))
  }

  // Get weekly pattern data
  const getWeeklyPatternData = () => {
    if (emotionEntries.length === 0) {
      return []
    }
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const pattern = weekdays.map(day => {
      const dayEntries = emotionEntries.filter(entry => {
        const entryDay = new Date(entry.created_at).toLocaleDateString('en', { weekday: 'long' })
        return entryDay === day
      })
      
      const avgIntensity = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + entry.intensity, 0) / dayEntries.length 
        : 0
      
      return {
        day: day.slice(0, 3),
        fullDay: day,
        entries: dayEntries.length,
        avgIntensity: Math.round(avgIntensity * 10) / 10
      }
    })
    
    return pattern
  }

  // Get time of day analysis
  const getTimeOfDayData = () => {
    if (emotionEntries.length === 0) {
      return []
    }
    
    const timeSlots = [
      { name: 'Morning', start: 6, end: 12, color: '#fbbf24' },
      { name: 'Afternoon', start: 12, end: 18, color: '#f59e0b' },
      { name: 'Evening', start: 18, end: 22, color: '#ef4444' },
      { name: 'Night', start: 22, end: 6, color: '#6366f1' }
    ]
    
    return timeSlots.map(slot => {
      const slotEntries = emotionEntries.filter(entry => {
        const hour = new Date(entry.created_at).getHours()
        if (slot.start <= slot.end) {
          return hour >= slot.start && hour < slot.end
        } else {
          // Night slot (22-6)
          return hour >= slot.start || hour < slot.end
        }
      })
      
      return {
        ...slot,
        entries: slotEntries.length,
        percentage: Math.round((slotEntries.length / emotionEntries.length) * 100)
      }
    })
  }

  // Get intensity range distribution
  const getIntensityRangeData = () => {
    if (emotionEntries.length === 0) {
      return []
    }
    
    const ranges = [
      { name: 'Very Low', min: 1, max: 3, color: '#ef4444' },
      { name: 'Low', min: 4, max: 5, color: '#f59e0b' },
      { name: 'Medium', min: 6, max: 7, color: '#10b981' },
      { name: 'High', min: 8, max: 10, color: '#3b82f6' }
    ]
    
    return ranges.map(range => {
      const rangeEntries = emotionEntries.filter(entry => 
        entry.intensity >= range.min && entry.intensity <= range.max
      )
      
      return {
        ...range,
        entries: rangeEntries.length,
        percentage: Math.round((rangeEntries.length / emotionEntries.length) * 100)
      }
    })
  }

  // Get recent activity data
  const getRecentActivityData = () => {
    return emotionEntries.slice(-5).reverse().map(entry => ({
      id: entry.id,
      emotion: entry.emotion_type?.name || 'Unknown',
      intensity: entry.intensity,
      time: new Date(entry.created_at).toLocaleTimeString('en', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      date: new Date(entry.created_at).toLocaleDateString('en', { 
        month: 'short', 
        day: 'numeric' 
      }),
      color: moodColors[entry.emotion_type?.name || ''] || '#6b7280'
    }))
  }

  const distributionData = getDistributionData()
  const weeklyPatternData = getWeeklyPatternData()
  const timeOfDayData = getTimeOfDayData()
  const intensityRangeData = getIntensityRangeData()
  const recentActivityData = getRecentActivityData()

  const handleExportData = () => {
    if (emotionEntries.length === 0) {
      alert('No emotion data to export')
      return
    }
    
    const csvContent = `Date,Time,Emotion,Intensity,Notes\n${emotionEntries.map(entry => {
      const date = new Date(entry.created_at).toLocaleDateString()
      const time = new Date(entry.created_at).toLocaleTimeString()
      const emotion = entry.emotion_type?.name || 'Unknown'
      return `"${date}","${time}","${emotion}","${entry.intensity}","${entry.notes || ''}"`
    }).join('\n')}`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `emotion-tracker-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-light">Loading your emotion data...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
            <p className="text-red-600 font-light mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Export */}
      <div className="flex items-center justify-between mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-light text-gray-800 mb-2">Emotion Tracker</h1>
          <p className="text-gray-500 font-light">Visualize your emotional patterns and progress</p>
        </motion.div>
        
        <motion.button 
          onClick={handleExportData}
          className="px-4 py-2.5 bg-white/50 backdrop-blur-sm border border-white/60 rounded-2xl hover:bg-white/70 flex items-center gap-2 transition-all font-light"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Download className="w-4 h-4" />
          Export Data
        </motion.button>
      </div>

      {emotionEntries.length === 0 ? (
        // Empty state
        <div className="text-center py-16">
          <Heart className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <h3 className="text-xl font-light text-gray-600 mb-2">No emotion data yet</h3>
          <p className="text-gray-500 font-light mb-6">Start tracking your emotions to see insights and patterns here.</p>
          <button 
            onClick={() => {
              // Navigate to emotions tab if possible
              const emotionsTab = document.querySelector('[data-tab="emotions"]') as HTMLElement
              if (emotionsTab) emotionsTab.click()
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Start Tracking
          </button>
        </div>
      ) : (
        <>
          {/* Bento Grid Layout */}
          <div className="space-y-4">
            {/* Stats Cards - Top Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 font-light">Average Intensity</span>
                  <Target className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-gray-800">{stats.average}/10</div>
                <div className="text-sm text-gray-500 font-light mt-1">Overall</div>
              </motion.div>
              
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 font-light">Trend</span>
                  {stats.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : stats.trend === 'down' ? (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="text-3xl font-light text-gray-800">
                  {stats.trend === 'up' ? '+' : stats.trend === 'down' ? '-' : ''}{stats.trendValue}
                </div>
                <div className="text-sm text-gray-500 font-light mt-1">
                  {stats.trend === 'up' ? 'Improving' : stats.trend === 'down' ? 'Declining' : 'Stable'}
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 font-light">Most Common</span>
                  <Award className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = moodIcons[stats.topMood] || Heart
                    return <Icon className="w-6 h-6" style={{ color: moodColors[stats.topMood] }} />
                  })()}
                  <div>
                    <div className="text-xl font-light text-gray-800">{stats.topMood}</div>
                    <div className="text-sm text-gray-500 font-light">{stats.topMoodCount} times</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 font-light">Streak</span>
                  <Activity className="w-4 h-4 text-gray-400" />
                </div>
                <div className="text-3xl font-light text-gray-800">{stats.streakDays} days</div>
                <div className="text-sm text-gray-500 font-light mt-1">Keep it going!</div>
              </motion.div>
            </div>

            {/* Line Chart - Full Width */}
            <motion.div 
              className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <LineChart className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Intensity Trend</h3>
                </div>
                <div className="text-sm text-gray-500 font-light">Last 7 entries</div>
              </div>
              
              <div className="h-48 relative">
                {/* Y-axis labels */}
                <div className="absolute -left-6 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-400 font-light">
                  <span>10</span>
                  <span>5</span>
                  <span>0</span>
                </div>
                
                {/* Chart area */}
                <div className="h-full relative">
                  {/* Horizontal grid lines */}
                  <div className="absolute inset-0">
                    <div className="h-px bg-gray-200/50 absolute top-0 left-0 right-0"></div>
                    <div className="h-px bg-gray-200/50 absolute top-1/2 left-0 right-0"></div>
                    <div className="h-px bg-gray-200/50 absolute bottom-0 left-0 right-0"></div>
                  </div>
                  
                  {emotionEntries.length > 0 && (
                    <>
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Smooth line path */}
                        <motion.path
                          d={(() => {
                            const recentEntries = emotionEntries.slice(-7)
                            if (recentEntries.length === 0) return "M 0 100 L 100 100"
                            
                            const points = recentEntries.map((entry, index) => ({
                              x: recentEntries.length > 1 ? (index / (recentEntries.length - 1)) * 100 : 50,
                              y: 100 - (entry.intensity / 10) * 100
                            }))
                            
                            if (points.length === 1) {
                              return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`
                            }
                            
                            // Create smooth path
                            let path = `M ${points[0].x} ${points[0].y}`
                            
                            for (let i = 1; i < points.length; i++) {
                              const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 2
                              const cp1y = points[i - 1].y
                              const cp2x = points[i - 1].x + (points[i].x - points[i - 1].x) / 2
                              const cp2y = points[i].y
                              
                              path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`
                            }
                            
                            return path
                          })()}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="2"
                          strokeLinecap="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </svg>
                      
                      {/* Data points with values */}
                      <div className="absolute inset-0">
                        {emotionEntries.slice(-7).map((entry, index) => {
                          const recentEntries = emotionEntries.slice(-7)
                          const x = recentEntries.length > 1 ? (index / (recentEntries.length - 1)) * 100 : 50
                          const y = 100 - (entry.intensity / 10) * 100
                          
                          return (
                            <motion.div
                              key={entry.id}
                              className="absolute"
                              style={{ 
                                left: `${x}%`, 
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.1 }}
                            >
                              <div className="relative">
                                {/* Point */}
                                <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                {/* Value label */}
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 font-medium">
                                  {entry.intensity}
                                </div>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-400 font-light">
                        {emotionEntries.slice(-7).map((entry, index) => (
                          <span key={entry.id}>
                            {new Date(entry.created_at).toLocaleDateString('en', { weekday: 'short' })}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Calendar View - Full Width */}
            <motion.div 
              className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Calendar View</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-500" />
                  </button>
                  <span className="text-lg font-light text-gray-700 min-w-[140px] text-center">
                    {currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-white/50 rounded-xl transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm text-gray-500 font-light py-2">
                    {day}
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((dayData, index) => {
                  const isCurrentMonth = dayData.date.getMonth() === currentMonth.getMonth()
                  const hasEntries = dayData.entries.length > 0
                  const avgIntensity = hasEntries 
                    ? dayData.entries.reduce((sum, entry) => sum + entry.intensity, 0) / dayData.entries.length 
                    : 0
                  
                  return (
                    <motion.button
                      key={index}
                      onClick={() => handleDateClick(dayData)}
                      className={`
                        aspect-square p-2 rounded-xl text-sm font-light transition-all
                        ${isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}
                        ${hasEntries ? 'bg-indigo-100 hover:bg-indigo-200 cursor-pointer' : 'hover:bg-white/50'}
                      `}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + (index * 0.01) }}
                      whileHover={{ scale: hasEntries ? 1.05 : 1 }}
                      whileTap={{ scale: hasEntries ? 0.95 : 1 }}
                    >
                      <div className="relative">
                        {dayData.date.getDate()}
                        {hasEntries && (
                          <div 
                            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                            style={{ 
                              backgroundColor: avgIntensity >= 7 ? '#10b981' : avgIntensity >= 4 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        )}
                      </div>
                    </motion.button>
                  )
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500 font-light">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>High (7-10)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Medium (4-6)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span>Low (1-3)</span>
                </div>
              </div>
            </motion.div>

            {/* Analytics Grid - New Spacious Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Emotion Distribution */}
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <PieChart className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Emotion Distribution</h3>
                </div>
                
                <div className="space-y-4">
                  {distributionData.map(({ mood, count, percentage }) => {
                    const Icon = moodIcons[mood] || Heart
                    return (
                      <div key={mood} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon 
                            className="w-4 h-4" 
                            style={{ color: moodColors[mood] || '#6b7280' }} 
                          />
                          <span className="text-sm font-light text-gray-700">{mood}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-500 font-light">{percentage}%</div>
                          <div className="w-16 h-2 rounded-full bg-gray-200/50">
                            <div 
                              className="h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: moodColors[mood] || '#6b7280'
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>

              {/* Weekly Pattern */}
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Weekly Pattern</h3>
                </div>
                
                <div className="space-y-4">
                  {weeklyPatternData.map(({ day, entries, avgIntensity }) => (
                    <div key={day} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 text-center">
                          <div className="text-sm font-light text-gray-700">{day}</div>
                        </div>
                        <div className="flex-1">
                          <div className="w-full h-3 bg-gray-100/50 rounded-full relative overflow-hidden">
                            {entries > 0 && (
                              <motion.div
                                className="absolute left-0 top-0 bottom-0 bg-indigo-500/60 rounded-full"
                                style={{ width: `${Math.min((entries / Math.max(...weeklyPatternData.map(d => d.entries))) * 100, 100)}%` }}
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((entries / Math.max(...weeklyPatternData.map(d => d.entries))) * 100, 100)}%` }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 font-light min-w-[60px] text-right">
                        {entries} entries
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Time of Day */}
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Time of Day</h3>
                </div>
                
                <div className="space-y-4">
                  {timeOfDayData.map(({ name, entries, percentage, color }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-light text-gray-700">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 font-light">{percentage}%</div>
                        <div className="w-16 h-2 rounded-full bg-gray-200/50">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Intensity Ranges */}
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Target className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Intensity Ranges</h3>
                </div>
                
                <div className="space-y-4">
                  {intensityRangeData.map(({ name, entries, percentage, color }) => (
                    <div key={name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm font-light text-gray-700">{name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-500 font-light">{entries}</div>
                        <div className="w-16 h-2 rounded-full bg-gray-200/50">
                          <div 
                            className="h-full rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Recent Activity</h3>
                </div>
                
                <div className="space-y-3">
                  {recentActivityData.map((activity, index) => (
                    <motion.div 
                      key={activity.id}
                      className="flex items-center gap-3 p-3 bg-white/20 rounded-xl"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                    >
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: activity.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-light text-gray-700 truncate">{activity.emotion}</div>
                        <div className="text-xs text-gray-500">{activity.date} • {activity.time}</div>
                      </div>
                      <div className="text-sm font-medium text-gray-800">{activity.intensity}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Summary Stats */}
              <motion.div 
                className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-5 h-5 text-gray-500" />
                  <h3 className="text-lg font-light text-gray-700">Summary</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-3xl font-light text-gray-800">{stats.totalEntries}</div>
                    <div className="text-sm text-gray-500 font-light">Total Entries</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-light text-gray-800">{stats.streakDays}</div>
                    <div className="text-sm text-gray-500 font-light">Day Streak</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-light text-gray-800">{stats.average}</div>
                    <div className="text-sm text-gray-500 font-light">Avg Intensity</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div 
              className="bg-white rounded-3xl p-8 max-w-md w-full"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-light text-gray-800">
                  {selectedDate.toLocaleDateString('en', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedDayEntries.map((entry) => {
                  const Icon = moodIcons[entry.emotion_type?.name || ''] || Heart
                  return (
                    <div key={entry.id} className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon 
                          className="w-5 h-5" 
                          style={{ color: moodColors[entry.emotion_type?.name || ''] || '#6b7280' }} 
                        />
                        <span className="font-medium text-gray-800">
                          {entry.emotion_type?.name || 'Unknown'}
                        </span>
                        <span className="text-sm text-gray-500 ml-auto">
                          Intensity: {entry.intensity}/10
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(entry.created_at).toLocaleTimeString()}
                      </div>
                      {entry.notes && (
                        <div className="text-sm text-gray-700 bg-white rounded-xl p-3">
                          {entry.notes}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}