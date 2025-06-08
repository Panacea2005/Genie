import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Circle
} from 'lucide-react'

interface MoodEntry {
  date: string
  mood: string
  intensity: number
  notes?: string
  activities?: string[]
  time?: string
}

interface DayData {
  date: Date
  entries: MoodEntry[]
}

export default function TrackerTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedDayEntries, setSelectedDayEntries] = useState<MoodEntry[]>([])

  // Sample data - in real app, this would come from a database
  const moodData: MoodEntry[] = [
    { date: '2024-01-15', mood: 'Happy', intensity: 8, time: '09:00', activities: ['Exercise', 'Meditation'], notes: 'Great morning workout!' },
    { date: '2024-01-15', mood: 'Calm', intensity: 7, time: '14:00', activities: ['Reading'], notes: 'Peaceful afternoon' },
    { date: '2024-01-16', mood: 'Calm', intensity: 7, time: '10:00', activities: ['Reading', 'Walk'] },
    { date: '2024-01-17', mood: 'Anxious', intensity: 4, time: '08:00', activities: ['Work'], notes: 'Big presentation today' },
    { date: '2024-01-17', mood: 'Happy', intensity: 8, time: '18:00', activities: ['Friends'], notes: 'Presentation went well!' },
    { date: '2024-01-18', mood: 'Happy', intensity: 9, time: '12:00', activities: ['Friends', 'Hobby'] },
    { date: '2024-01-19', mood: 'Tired', intensity: 5, time: '20:00', activities: ['Rest'] },
    { date: '2024-01-20', mood: 'Peaceful', intensity: 8, time: '11:00', activities: ['Yoga', 'Nature'] },
    { date: '2024-01-21', mood: 'Happy', intensity: 7, time: '15:00', activities: ['Family'] }
  ]

  const moodIcons: { [key: string]: React.ComponentType<{ className?: string; style?: React.CSSProperties }> } = {
    Happy: Sun,
    Calm: Flower2,
    Anxious: Zap,
    Sad: CloudRain,
    Tired: Moon,
    Peaceful: Waves,
    Angry: Cloud,
    Excited: Heart
  }

  const moodColors: { [key: string]: string } = {
    Happy: '#f59e0b', // amber-500
    Calm: '#10b981', // emerald-500
    Anxious: '#a855f7', // purple-500
    Sad: '#3b82f6', // blue-500
    Tired: '#6b7280', // gray-500
    Peaceful: '#06b6d4', // cyan-500
    Angry: '#ef4444', // red-500
    Excited: '#ec4899' // pink-500
  }

  const getMoodStats = () => {
    const avgIntensity = moodData.reduce((sum, entry) => sum + entry.intensity, 0) / moodData.length
    const trend = moodData[moodData.length - 1].intensity - moodData[0].intensity
    const mostCommon = moodData.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    const topMood = Object.entries(mostCommon).sort(([,a], [,b]) => b - a)[0]
    
    return {
      average: avgIntensity.toFixed(1),
      trend: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
      trendValue: Math.abs(trend),
      topMood: topMood?.[0] || 'Unknown',
      topMoodCount: topMood?.[1] || 0,
      totalEntries: moodData.length,
      streakDays: 7,
      improvement: 23
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
      const entries = moodData.filter(entry => entry.date === dateStr)
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
    const distribution = moodData.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1
      return acc
    }, {} as { [key: string]: number })
    
    return Object.entries(distribution).map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / moodData.length) * 100)
    }))
  }

  const distributionData = getDistributionData()

  const handleExportData = () => {
    const csvContent = `Date,Time,Mood,Intensity,Activities,Notes\n${moodData.map(entry => 
      `${entry.date},${entry.time || ''},${entry.mood},${entry.intensity},"${entry.activities?.join(', ') || ''}","${entry.notes || ''}"`
    ).join('\n')}`
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mood-tracker-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Export */}
      <div className="flex items-center justify-between mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-light text-gray-800 mb-2">Mood Tracker</h1>
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
              <span className="text-sm text-gray-500 font-light">Average Mood</span>
              <Target className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-light text-gray-800">{stats.average}/10</div>
            <div className="text-sm text-gray-500 font-light mt-1">This week</div>
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

        {/* Line Chart - Full Width - Minimal Design */}
        <motion.div 
          className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-medium text-gray-800">Mood Trend</h3>
            <span className="text-xs text-gray-500 font-light">Last 7 days</span>
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
              
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Smooth line path */}
                <motion.path
                  d={(() => {
                    const points = moodData.slice(-7).map((entry, index) => ({
                      x: (index / 6) * 100,
                      y: 100 - (entry.intensity / 10) * 100
                    }))
                    
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
                {moodData.slice(-7).map((entry, index) => {
                  const x = (index / 6) * 100
                  const y = 100 - (entry.intensity / 10) * 100
                  
                  return (
                    <motion.div
                      key={index}
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
                {moodData.slice(-7).map((entry, index) => (
                  <span key={index}>
                    {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bar and Pie Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bar Chart - Minimal Design */}
          <motion.div 
            className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <h3 className="text-base font-medium text-gray-800 mb-6">Daily Intensity</h3>
            
            <div className="space-y-3">
              {moodData.slice(-7).map((entry, index) => {
                const Icon = moodIcons[entry.mood] || Heart
                const percentage = (entry.intensity / 10) * 100
                
                return (
                  <motion.div
                    key={`bar-${index}`}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    {/* Date */}
                    <span className="text-xs text-gray-500 font-light w-8">
                      {new Date(entry.date).getDate()}
                    </span>
                    
                    {/* Icon */}
                    <Icon className="w-4 h-4 flex-shrink-0" style={{ color: moodColors[entry.mood] }} />
                    
                    {/* Bar */}
                    <div className="flex-1 bg-gray-100/50 rounded-full h-6 relative overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-2"
                        style={{ backgroundColor: moodColors[entry.mood] + '20' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.3 + index * 0.05, duration: 0.5 }}
                      >
                        <span className="text-xs font-medium" style={{ color: moodColors[entry.mood] }}>
                          {entry.intensity}
                        </span>
                      </motion.div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>          
          
          {/* Pie Chart - Enhanced Design */}
          <motion.div 
            className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-base font-medium text-gray-800 mb-6">Mood Distribution</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Enhanced Donut chart with center text */}
              <div className="relative flex-shrink-0">
                <svg viewBox="0 0 120 120" className="w-40 h-40">
                  <defs>
                    {distributionData.map((data, index) => (
                      <linearGradient
                        key={`gradient-${data.mood}`}
                        id={`gradient-${data.mood}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor={moodColors[data.mood]} stopOpacity="0.8" />
                        <stop offset="100%" stopColor={moodColors[data.mood]} stopOpacity="1" />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  {/* Background circle */}
                  <circle cx="60" cy="60" r="50" fill="#f9fafb" stroke="#f3f4f6" strokeWidth="1" />
                  
                  {(() => {
                    let cumulativePercentage = 0
                    const radius = 44
                    const circumference = 2 * Math.PI * radius
                    
                    return distributionData.map((data, index) => {
                      const strokeDasharray = `${(data.percentage / 100) * circumference} ${circumference}`
                      const strokeDashoffset = -((cumulativePercentage / 100) * circumference)
                      cumulativePercentage += data.percentage
                      
                      return (
                        <motion.circle
                          key={data.mood}
                          cx="60"
                          cy="60"
                          r={radius}
                          fill="transparent"
                          stroke={`url(#gradient-${data.mood})`}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          transform="rotate(-90 60 60)"
                          initial={{ strokeDashoffset: -circumference }}
                          animate={{ strokeDashoffset }}
                          transition={{ 
                            delay: index * 0.1, 
                            duration: 0.7,
                            ease: "easeOut" 
                          }}
                          style={{ filter: "drop-shadow(0px 2px 3px rgba(0,0,0,0.1))" }}
                        />
                      )
                    })
                  })()}
                  
                  {/* Center text */}
                  <text
                    x="60"
                    y="56"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-2xl font-medium text-gray-800"
                    style={{ fontSize: '14px' }}
                  >
                    {distributionData.length}
                  </text>
                  <text
                    x="60"
                    y="74"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-sm font-light text-gray-500"
                    style={{ fontSize: '10px' }}
                  >
                    Moods
                  </text>
                </svg>
              </div>
              
              {/* Enhanced Legend with icons */}
              <div className="flex-1 space-y-2.5 w-full">
                {distributionData.map((data) => {
                  const Icon = moodIcons[data.mood] || Heart
                  return (
                    <motion.div 
                      key={data.mood} 
                      className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-2.5 rounded-xl hover:bg-white/60 transition-colors"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * distributionData.indexOf(data) }}
                      whileHover={{ x: 3 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${moodColors[data.mood]}20` }}
                        >
                          <Icon 
                            className="w-4 h-4" 
                            style={{ color: moodColors[data.mood] }}
                          />
                        </div>
                        <span className="text-sm text-gray-700 font-light">{data.mood}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full rounded-full"
                            style={{ backgroundColor: moodColors[data.mood] }}
                            initial={{ width: 0 }}
                            animate={{ width: `${data.percentage}%` }}
                            transition={{ delay: 0.5, duration: 0.7 }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-500 w-8 text-right">{data.percentage}%</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Calendar and Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar View - 2 columns */}
          <motion.div 
            className="lg:col-span-2 bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/50 rounded-xl">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-base font-medium text-gray-800">Mood Calendar</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigateMonth('prev')}
                  className="p-1.5 hover:bg-white/50 rounded-xl transition-all"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium px-3 text-gray-700">
                  {currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => navigateMonth('next')}
                  className="p-1.5 hover:bg-white/50 rounded-xl transition-all"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {/* Week days */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={`weekday-${index}`} className="text-center text-xs text-gray-500 font-medium py-2">
                  {day.charAt(0)}
                </div>
              ))}
              
              {/* Calendar days */}
              {getCalendarDays().map((dayData, index) => {
                const isCurrentMonth = dayData.date.getMonth() === currentMonth.getMonth()
                const isToday = dayData.date.toDateString() === new Date().toDateString()
                const hasEntries = dayData.entries.length > 0
                
                return (
                  <motion.div
                    key={index}
                    whileHover={hasEntries ? { scale: 1.05 } : {}}
                    className={`
                      aspect-square rounded-2xl p-2 cursor-pointer transition-all flex flex-col items-center justify-center
                      ${isCurrentMonth 
                        ? hasEntries 
                          ? 'bg-white/50 hover:bg-white/70' 
                          : 'hover:bg-white/30'
                        : 'opacity-30'
                      }
                      ${isToday ? 'ring-2 ring-indigo-400' : ''}
                    `}
                    onClick={() => handleDateClick(dayData)}
                  >
                    <div className="text-sm font-light text-gray-700">
                      {dayData.date.getDate()}
                    </div>
                    
                    {/* Mood indicator */}
                    {hasEntries && (
                      <div className="mt-1">
                        {dayData.entries.slice(0, 1).map((entry, i) => {
                          const Icon = moodIcons[entry.mood] || Heart
                          return (
                            <Icon 
                              key={i} 
                              className="w-3.5 h-3.5" 
                              style={{ color: moodColors[entry.mood] }}
                            />
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Weekly Insights - 1 column */}
          <motion.div 
            className="bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-white/50 rounded-xl">
                <Info className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="text-base font-medium text-gray-800">Weekly Insights</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/30 rounded-2xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Best Day
                </h4>
                <p className="text-sm text-gray-600 font-light">
                  Fridays show highest mood scores with average 8.2/10
                </p>
              </div>
              
              <div className="bg-white/30 rounded-2xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Mood Triggers
                </h4>
                <p className="text-sm text-gray-600 font-light">
                  Exercise correlates with +2.5 mood improvement
                </p>
              </div>
              
              <div className="bg-white/30 rounded-2xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  Weekly Pattern
                </h4>
                <p className="text-sm text-gray-600 font-light">
                  Mid-week dip on Wednesday, recovery by Thursday evening
                </p>
              </div>
              
              <div className="bg-white/30 rounded-2xl p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Recommendation
                </h4>
                <p className="text-sm text-gray-600 font-light">
                  Schedule important tasks on morning for optimal mood
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Day Detail Modal - Minimal Design */}
      <AnimatePresence>
        {showDetailModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/10 backdrop-blur-md z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
            />
            
            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 relative max-h-[80vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <motion.button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-gray-100/50 rounded-2xl transition-all"
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </motion.button>
                
                {/* Header */}
                <div className="text-center mb-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                  >
                    <Calendar className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-2xl font-light text-gray-800">
                    {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </h3>
                </div>
                
                <div className="space-y-4">
                  {selectedDayEntries.map((entry, index) => {
                    const Icon = moodIcons[entry.mood] || Heart
                    
                    return (
                      <motion.div 
                        key={index} 
                        className="bg-white/50 backdrop-blur-sm rounded-2xl p-5"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Icon 
                              className="w-8 h-8" 
                              style={{ color: moodColors[entry.mood] }}
                            />
                            <div>
                              <div className="font-medium text-gray-800">{entry.mood}</div>
                              <div className="text-sm text-gray-500 font-light">{entry.time || 'No time recorded'}</div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-light text-gray-800">{entry.intensity}/10</div>
                            <div className="text-xs text-gray-500 font-light">Intensity</div>
                          </div>
                        </div>
                        
                        {entry.activities && entry.activities.length > 0 && (
                          <div className="mb-3">
                            <div className="text-sm text-gray-600 font-light mb-2">Activities:</div>
                            <div className="flex flex-wrap gap-2">
                              {entry.activities.map((activity, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100/50 backdrop-blur-sm rounded-full text-xs font-light">
                                  {activity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {entry.notes && (
                          <div className="pt-3 border-t border-gray-200/30">
                            <p className="text-sm text-gray-600 font-light">{entry.notes}</p>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
                
                <motion.button 
                  onClick={() => setShowDetailModal(false)}
                  className="w-full mt-6 py-3 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all font-light"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
                </motion.button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}