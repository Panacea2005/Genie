import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from '@/app/contexts/AuthContext'
import { 
  WellnessService, 
  WellnessExercise, 
  WellnessStats,
  TodaysCompletion,
  WellnessCompletion
} from '@/lib/services/wellnessService'
import {
  Wind,
  Activity,
  Flower2,
  Sun,
  Clock,
  Star,
  TrendingUp,
  Heart,
  Waves,
  ChevronRight,
  Loader2,
  AlertCircle,
  Zap,
  Play,
  CheckCircle
} from "lucide-react";

// Icon mapping for wellness exercises
const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  'Wind': Wind,
  'Activity': Activity,
  'Flower2': Flower2,
  'Sun': Sun,
  'Heart': Heart,
  'Waves': Waves,
  'Star': Star,
  'Zap': Zap,
  'Play': Play,
  'Clock': Clock
}

export default function WellnessTab() {
  const router = useRouter();
  const { user } = useAuth()

  // State management
  const [exercises, setExercises] = useState<WellnessExercise[]>([])
  const [todaysCompletions, setTodaysCompletions] = useState<TodaysCompletion[]>([])
  const [recentCompletions, setRecentCompletions] = useState<WellnessCompletion[]>([])
  const [stats, setStats] = useState<WellnessStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingExercise, setCompletingExercise] = useState<string | null>(null)

  // Load wellness data on component mount
  useEffect(() => {
    if (!user?.id) return

    const loadWellnessData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load exercises, today's completions, and stats in parallel
        const [exercisesResult, statsResult, recentResult] = await Promise.all([
          WellnessService.getWellnessExercises(),
          WellnessService.getWellnessStats(user.id),
          WellnessService.getWellnessCompletions(user.id, 10) // Get recent for activity feed
        ])

        if (exercisesResult.error) {
          throw new Error('Failed to load wellness exercises')
        }
        if (statsResult.error) {
          throw new Error('Failed to load wellness statistics')
        }
        if (recentResult.error) {
          throw new Error('Failed to load recent completions')
        }

        setExercises(exercisesResult.data || [])
        setStats(statsResult.data)
        setRecentCompletions(recentResult.data || [])

        // Get today's completions
        const todaysResult = await WellnessService.getTodaysCompletions(user.id)
        if (!todaysResult.error) {
          setTodaysCompletions(todaysResult.data || [])
        }

      } catch (err: any) {
        console.error('Error loading wellness data:', err)
        setError(err.message || 'Failed to load wellness data')
      } finally {
        setLoading(false)
      }
    }

    loadWellnessData()
  }, [user?.id])

  const handleExerciseClick = async (exercise: WellnessExercise) => {
    if (!user?.id) return

    // Check if exercise is already completed today
    const isCompleted = todaysCompletions.some(c => c.exercise_id === exercise.id)
    
    if (isCompleted) {
      // Navigate to exercise page for re-doing or viewing details
      router.push(`/dashboard/wellness/${exercise.id}`)
      return
    }

    // Quick complete option for shorter exercises, or navigate for longer ones
    if (exercise.duration_seconds <= 120) { // 2 minutes or less
      await quickCompleteExercise(exercise)
    } else {
      router.push(`/dashboard/wellness/${exercise.id}`)
    }
  }

  const quickCompleteExercise = async (exercise: WellnessExercise) => {
    if (!user?.id) return

    try {
      setCompletingExercise(exercise.id)

      const result = await WellnessService.completeExercise(user.id, exercise.id, {
        actualDurationSeconds: exercise.duration_seconds,
        rating: 4 // Default good rating for quick completion
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Refresh data after completion
      await refreshData()

    } catch (err: any) {
      console.error('Error completing exercise:', err)
      setError(err.message || 'Failed to complete exercise')
    } finally {
      setCompletingExercise(null)
    }
  }

  const refreshData = async () => {
    if (!user?.id) return

    try {
      const [statsResult, todaysResult, recentResult] = await Promise.all([
        WellnessService.getWellnessStats(user.id),
        WellnessService.getTodaysCompletions(user.id),
        WellnessService.getWellnessCompletions(user.id, 10)
      ])

      if (!statsResult.error) setStats(statsResult.data)
      if (!todaysResult.error) setTodaysCompletions(todaysResult.data || [])
      if (!recentResult.error) setRecentCompletions(recentResult.data || [])

    } catch (err: any) {
      console.error('Error refreshing data:', err)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-light">Loading your wellness data...</p>
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

  // No data state
  if (exercises.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-16">
          <Heart className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <h3 className="text-xl font-light text-gray-600 mb-2">No wellness exercises available</h3>
          <p className="text-gray-500 font-light mb-6">Wellness exercises will appear here once they're configured.</p>
        </div>
      </div>
    )
  }

  const practiceTimeToday = stats?.total_practice_time_today || 0
  const currentMood = stats?.most_recent_mood || 'Unknown'

  return (
    <div className="max-w-6xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">
                {stats?.completions_today || 0}
              </div>
              <div className="text-xs text-gray-500 font-light">Completed</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-blue-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">
                {Math.floor(practiceTimeToday / 60)}m
              </div>
              <div className="text-xs text-gray-500 font-light">
                Practice Time
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-amber-500" />
            <div>
              <div className="text-2xl font-light text-gray-900">
                {stats?.streak_days || 0}
              </div>
              <div className="text-xs text-gray-500 font-light">Day Streak</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40 p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-2xl font-light text-gray-900 capitalize">
                {currentMood}
              </div>
              <div className="text-xs text-gray-500 font-light">
                Recent Mood
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Exercise Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {exercises.map((exercise, index) => {
          const Icon = iconMap[exercise.icon_name] || Heart
          const isCompleted = todaysCompletions.some(c => c.exercise_id === exercise.id)
          const isCompleting = completingExercise === exercise.id

          return (
            <motion.button
              key={exercise.id}
              onClick={() => !isCompleting && handleExerciseClick(exercise)}
              disabled={isCompleting}
              className="bg-white/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6 text-left hover:bg-white/50 hover:border-white/60 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ y: isCompleting ? 0 : -5 }}
              whileTap={{ scale: isCompleting ? 1 : 0.98 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {isCompleting ? (
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  ) : (
                    <Icon
                      className="w-8 h-8 transition-colors duration-300"
                      style={{ color: exercise.color }}
                    />
                  )}
                </div>

                {isCompleted && (
                  <motion.div
                    className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50/50 backdrop-blur-sm px-2 py-1 rounded-full"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    Done
                  </motion.div>
                )}
              </div>

              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {exercise.name}
              </h3>
              <p className="text-sm text-gray-600 font-light mb-4">
                {exercise.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(exercise.duration_seconds)}
                  </span>
                  <span>•</span>
                  <span 
                    className="capitalize px-2 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: WellnessService.getDifficultyColor(exercise.difficulty) }}
                  >
                    {exercise.difficulty}
                  </span>
                </div>

                {!isCompleting && (
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all group-hover:translate-x-1" />
                )}
              </div>

              {/* Category badge */}
              <div className="mt-3 pt-3 border-t border-gray-200/30">
                <span className="text-xs text-gray-500 font-light">
                  {WellnessService.getCategoryDisplayName(exercise.category)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        className="mt-12 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 backdrop-blur-sm rounded-3xl border border-white/40 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-base font-medium text-gray-800 mb-4">
          Recent Activity
        </h3>
        
        {recentCompletions.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-8 h-8 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-light">No recent activity</p>
            <p className="text-sm text-gray-400 font-light">Complete your first exercise to see activity here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCompletions.slice(0, 5).map((completion) => {
              const exercise = completion.exercise
              if (!exercise) return null

              const Icon = iconMap[exercise.icon_name] || Heart
              const relativeTime = WellnessService.getRelativeTime(completion.completed_at)
              
              return (
                <div key={completion.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <Icon 
                      className="w-4 h-4" 
                      style={{ color: exercise.color }} 
                    />
                    <span className="text-gray-700">{exercise.name}</span>
                    {completion.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-current" />
                        <span className="text-xs text-gray-500">{completion.rating}/5</span>
                      </div>
                    )}
                  </div>
                  <span className="text-gray-500 font-light">{relativeTime}</span>
                </div>
              )
            })}
          </div>
        )}

        {/* Show categories practiced today */}
        {stats && stats.categories_practiced.length > 0 && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="text-sm text-gray-600 mb-2">Today's Focus Areas:</div>
            <div className="flex flex-wrap gap-2">
              {stats.categories_practiced.map((category) => (
                <span 
                  key={category}
                  className="px-3 py-1 bg-white/40 backdrop-blur-sm rounded-full text-xs font-light text-gray-700"
                >
                  {WellnessService.getCategoryDisplayName(category)}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
