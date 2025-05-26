import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
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
  X
} from 'lucide-react'

interface MoodEntry {
  date: string
  mood: string
  intensity: number
  notes?: string
  activities?: string[]
  time?: string
}

interface ChartView {
  id: 'line' | 'bar' | 'pie'
  name: string
  icon: React.ComponentType<{ className?: string }>
}

interface DayData {
  date: Date
  entries: MoodEntry[]
}

export default function TrackerTab() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('week')
  const [chartView, setChartView] = useState<'line' | 'bar' | 'pie'>('line')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [showDetailModal, setShowDetailModal] = useState(false)
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

  const chartViews: ChartView[] = [
    { id: 'line', name: 'Trend', icon: LineChart },
    { id: 'bar', name: 'Compare', icon: BarChart3 },
    { id: 'pie', name: 'Distribution', icon: PieChart }
  ]

  const moodIcons: { [key: string]: React.ComponentType<{ className?: string }> } = {
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
    Happy: 'from-yellow-400 to-orange-400',
    Calm: 'from-green-400 to-emerald-400',
    Anxious: 'from-purple-400 to-pink-400',
    Sad: 'from-blue-400 to-indigo-400',
    Tired: 'from-gray-400 to-slate-400',
    Peaceful: 'from-cyan-400 to-blue-400',
    Angry: 'from-red-400 to-rose-400',
    Excited: 'from-pink-400 to-purple-400'
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">Mood Tracker</h1>
          <p className="text-gray-500">Visualize your emotional patterns and progress</p>
        </div>
        
        <button className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Average Mood</span>
            <Target className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-light text-gray-900">{stats.average}/10</div>
          <div className="text-sm text-gray-500 mt-1">This {selectedPeriod}</div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Trend</span>
            {stats.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-500" />
            ) : (
              <Minus className="w-4 h-4 text-gray-400" />
            )}
          </div>
          <div className="text-3xl font-light text-gray-900 flex items-center gap-2">
            {stats.trend === 'up' ? '+' : stats.trend === 'down' ? '-' : ''}{stats.trendValue}
            <span className="text-sm text-gray-500">points</span>
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.trend === 'up' ? 'Improving' : stats.trend === 'down' ? 'Declining' : 'Stable'}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Most Common</span>
            <Award className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = moodIcons[stats.topMood] || Heart
              return <Icon className="w-6 h-6 text-gray-700" />
            })()}
            <div>
              <div className="text-xl font-light text-gray-900">{stats.topMood}</div>
              <div className="text-sm text-gray-500">{stats.topMoodCount} times</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Streak</span>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <div className="text-3xl font-light text-gray-900">{stats.streakDays} days</div>
          <div className="text-sm text-gray-500 mt-1">Keep it going!</div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              {(['week', 'month', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm capitalize transition-colors ${
                    selectedPeriod === period
                      ? 'bg-gray-900 text-white'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            
            <div className="h-8 w-px bg-gray-200" />
            
            {/* Chart View Selector */}
            <div className="flex items-center gap-2">
              {chartViews.map((view) => {
                const Icon = view.icon
                return (
                  <button
                    key={view.id}
                    onClick={() => setChartView(view.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      chartView === view.id
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-50'
                    }`}
                    title={view.name}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>
          
          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        {chartView === 'bar' && (
          <div className="h-64 flex items-end justify-between gap-4">
            {moodData.slice(-7).map((entry, index) => {
              const height = (entry.intensity / 10) * 100
              const Icon = moodIcons[entry.mood] || Heart
              
              return (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${height}%` }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-1 relative group"
                >
                  <div
                    className={`w-full h-full bg-gradient-to-t ${moodColors[entry.mood]} rounded-t-lg relative overflow-hidden cursor-pointer`}
                    onClick={() => handleDateClick({ date: new Date(entry.date), entries: [entry] })}
                  >
                    {/* Icon at top of bar */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <Icon className="w-5 h-5 text-gray-400" />
                    </div>
                    
                    {/* Hover info */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 text-white p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="font-medium">{entry.mood}</div>
                      <div>Intensity: {entry.intensity}/10</div>
                    </div>
                  </div>
                  
                  {/* Date label */}
                  <div className="text-xs text-gray-500 text-center mt-2">
                    {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {chartView === 'line' && (
          <div className="h-64 relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
              <span>10</span>
              <span>5</span>
              <span>0</span>
            </div>
            
            {/* Line chart area */}
            <div className="ml-8 h-full relative">
              <svg className="w-full h-full">
                {/* Grid lines */}
                <line x1="0" y1="0" x2="100%" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="100%" x2="100%" y2="100%" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Line path */}
                <motion.path
                  d={`M ${moodData.slice(-7).map((entry, index) => {
                    const x = (index / 6) * 100
                    const y = 100 - (entry.intensity / 10) * 100
                    return `${x}% ${y}%`
                  }).join(' L ')}`}
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1 }}
                />
                
                {/* Gradient definition */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a78bfa" />
                  </linearGradient>
                </defs>
                
                {/* Data points */}
                {moodData.slice(-7).map((entry, index) => {
                  const x = (index / 6) * 100
                  const y = 100 - (entry.intensity / 10) * 100
                  const Icon = moodIcons[entry.mood] || Heart
                  
                  return (
                    <g key={index}>
                      <circle
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="6"
                        fill="white"
                        stroke="#6366f1"
                        strokeWidth="3"
                        className="cursor-pointer"
                        onClick={() => handleDateClick({ date: new Date(entry.date), entries: [entry] })}
                      />
                    </g>
                  )
                })}
              </svg>
              
              {/* X-axis labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
                {moodData.slice(-7).map((entry, index) => (
                  <span key={index}>
                    {new Date(entry.date).toLocaleDateString('en', { weekday: 'short' })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {chartView === 'pie' && (
          <div className="h-64 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
              {/* Pie chart */}
              <div className="relative">
                <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                  {(() => {
                    let cumulativePercentage = 0
                    return distributionData.map((data, index) => {
                      const startAngle = (cumulativePercentage * 360) / 100
                      const endAngle = ((cumulativePercentage + data.percentage) * 360) / 100
                      cumulativePercentage += data.percentage
                      
                      const startAngleRad = (startAngle * Math.PI) / 180
                      const endAngleRad = (endAngle * Math.PI) / 180
                      
                      const x1 = 100 + 80 * Math.cos(startAngleRad)
                      const y1 = 100 + 80 * Math.sin(startAngleRad)
                      const x2 = 100 + 80 * Math.cos(endAngleRad)
                      const y2 = 100 + 80 * Math.sin(endAngleRad)
                      
                      const largeArcFlag = data.percentage > 50 ? 1 : 0
                      
                      return (
                        <motion.path
                          key={data.mood}
                          d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                          fill={`url(#gradient-${data.mood})`}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="cursor-pointer hover:opacity-80"
                        />
                      )
                    })
                  })()}
                  
                  {/* Gradients */}
                  <defs>
                    {Object.entries(moodColors).map(([mood, gradient]) => (
                      <linearGradient key={mood} id={`gradient-${mood}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={`${gradient.split(' ')[1]}`} />
                        <stop offset="100%" className={`${gradient.split(' ')[3]}`} />
                      </linearGradient>
                    ))}
                  </defs>
                </svg>
              </div>
              
              {/* Legend */}
              <div className="flex flex-col justify-center space-y-3">
                {distributionData.map((data) => {
                  const Icon = moodIcons[data.mood] || Heart
                  return (
                    <div key={data.mood} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${moodColors[data.mood]}`} />
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm text-gray-700">{data.mood}</span>
                      </div>
                      <span className="text-sm text-gray-500">{data.percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Mood Calendar</h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium px-2">
                {currentMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
              </span>
              <button 
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {/* Week days */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs text-gray-500 font-medium py-2">
                {day}
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
                    aspect-square rounded-lg border p-2 cursor-pointer transition-all
                    ${isCurrentMonth 
                      ? hasEntries 
                        ? 'border-gray-300 hover:border-gray-400 bg-white' 
                        : 'border-gray-200 hover:border-gray-300'
                      : 'border-transparent text-gray-300'
                    }
                    ${isToday ? 'ring-2 ring-indigo-500' : ''}
                  `}
                  onClick={() => handleDateClick(dayData)}
                >
                  <div className="text-xs font-medium">
                    {dayData.date.getDate()}
                  </div>
                  
                  {/* Mood indicators */}
                  {hasEntries && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {dayData.entries.slice(0, 3).map((entry, i) => {
                        const Icon = moodIcons[entry.mood] || Heart
                        return (
                          <div key={i} className="relative group">
                            <Icon className="w-3 h-3 text-gray-600" />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                              {entry.mood} - {entry.intensity}/10
                            </div>
                          </div>
                        )
                      })}
                      {dayData.entries.length > 3 && (
                        <span className="text-[10px] text-gray-500">+{dayData.entries.length - 3}</span>
                      )}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Insights and Patterns */}
        <div className="space-y-6">
          {/* Insights Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-indigo-600" />
              Insights
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Best Day</h4>
                <p className="text-sm text-gray-600">
                  Fridays tend to be your happiest days, with an average mood of 8.2/10
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Mood Triggers</h4>
                <p className="text-sm text-gray-600">
                  Exercise and social activities correlate with +2.5 mood improvement
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Pattern</h4>
                <p className="text-sm text-gray-600">
                  Your mood dips mid-week but recovers by Thursday evening
                </p>
              </div>
            </div>
          </div>

          {/* Recent Notes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Notes</h3>
            
            <div className="space-y-3">
              {moodData.filter(entry => entry.notes).slice(-3).reverse().map((entry, index) => (
                <div key={index} className="pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2 mb-1">
                    {(() => {
                      const Icon = moodIcons[entry.mood] || Heart
                      return <Icon className="w-4 h-4 text-gray-600" />
                    })()}
                    <span className="text-sm font-medium text-gray-700">{entry.mood}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{entry.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Day Detail Modal */}
      {showDetailModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDetailModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-medium text-gray-900">
                  {selectedDate.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-4">
                {selectedDayEntries.map((entry, index) => {
                  const Icon = moodIcons[entry.mood] || Heart
                  
                  return (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${moodColors[entry.mood]} flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{entry.mood}</div>
                            <div className="text-sm text-gray-500">{entry.time || 'No time recorded'}</div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-light text-gray-900">{entry.intensity}/10</div>
                          <div className="text-xs text-gray-500">Intensity</div>
                        </div>
                      </div>
                      
                      {entry.activities && entry.activities.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 mb-1">Activities:</div>
                          <div className="flex flex-wrap gap-2">
                            {entry.activities.map((activity, i) => (
                              <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-xs">
                                {activity}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {entry.notes && (
                        <div className="pt-3 border-t border-gray-100">
                          <p className="text-sm text-gray-600">{entry.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              
              <button 
                onClick={() => setShowDetailModal(false)}
                className="w-full mt-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}