import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Wind,
  Activity,
  Flower2,
  Sun,
  Clock,
  Volume2,
  VolumeX,
  ChevronRight,
  Star,
  TrendingUp
} from 'lucide-react'

interface Exercise {
  id: string
  name: string
  description: string
  duration: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  gradient: string
  icon: React.ComponentType<{ className?: string }>
  steps?: string[]
}

export default function WellnessTab() {
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [completedToday, setCompletedToday] = useState<string[]>([])

  const exercises: Exercise[] = [
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'A powerful stress relief technique used by Navy SEALs',
      duration: '4 min',
      category: 'breathing',
      difficulty: 'beginner',
      gradient: 'from-blue-400 to-cyan-500',
      icon: Wind,
      steps: [
        'Breathe in for 4 seconds',
        'Hold for 4 seconds',
        'Breathe out for 4 seconds',
        'Hold empty for 4 seconds'
      ]
    },
    {
      id: 'body-scan',
      name: 'Body Scan',
      description: 'Progressive relaxation through mindful awareness',
      duration: '10 min',
      category: 'meditation',
      difficulty: 'intermediate',
      gradient: 'from-purple-400 to-pink-500',
      icon: Activity,
      steps: [
        'Start at your toes',
        'Notice sensations without judgment',
        'Slowly move up through each body part',
        'Release tension as you go'
      ]
    },
    {
      id: 'grounding',
      name: '5-4-3-2-1 Grounding',
      description: 'Quick technique to manage anxiety and panic',
      duration: '2 min',
      category: 'grounding',
      difficulty: 'beginner',
      gradient: 'from-green-400 to-emerald-500',
      icon: Flower2,
      steps: [
        'Name 5 things you can see',
        'Name 4 things you can touch',
        'Name 3 things you can hear',
        'Name 2 things you can smell',
        'Name 1 thing you can taste'
      ]
    },
    {
      id: 'mindful-walking',
      name: 'Mindful Walking',
      description: 'Moving meditation for active relaxation',
      duration: '15 min',
      category: 'movement',
      difficulty: 'intermediate',
      gradient: 'from-orange-400 to-red-500',
      icon: Sun
    }
  ]

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
        setProgress(prev => Math.min(prev + 2, 100))
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isPlaying])

  // Auto advance steps
  useEffect(() => {
    if (isPlaying && activeExercise) {
      const exercise = exercises.find(e => e.id === activeExercise)
      if (exercise?.steps && progress >= 25 * (currentStep + 1)) {
        if (currentStep < exercise.steps.length - 1) {
          setCurrentStep(prev => prev + 1)
        }
      }
    }
  }, [progress, currentStep, activeExercise, isPlaying])

  const startExercise = (exerciseId: string) => {
    setActiveExercise(exerciseId)
    setIsPlaying(true)
    setProgress(0)
    setCurrentStep(0)
    setSessionTime(0)
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const resetExercise = () => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentStep(0)
    setSessionTime(0)
  }

  const completeExercise = () => {
    if (activeExercise && !completedToday.includes(activeExercise)) {
      setCompletedToday([...completedToday, activeExercise])
    }
    resetExercise()
    setActiveExercise(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-light text-gray-900 mb-2">Wellness Exercises</h1>
        <p className="text-gray-500">Practice mindfulness and relaxation techniques</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">{completedToday.length}</div>
              <div className="text-xs text-gray-500">Completed Today</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">{Math.floor(sessionTime / 60)}m</div>
              <div className="text-xs text-gray-500">Today's Practice</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">7</div>
              <div className="text-xs text-gray-500">Day Streak</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-light text-gray-900">85%</div>
              <div className="text-xs text-gray-500">Consistency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise Grid */}
      {!activeExercise ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exercises.map((exercise) => {
            const Icon = exercise.icon
            const isCompleted = completedToday.includes(exercise.id)
            
            return (
              <motion.div
                key={exercise.id}
                whileHover={{ y: -2 }}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              >
                {/* Image placeholder area */}
                <div className={`h-48 bg-gradient-to-br ${exercise.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon className="w-24 h-24 text-white/20" />
                  </div>
                  
                  {/* Difficulty badge */}
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium capitalize">
                    {exercise.difficulty}
                  </div>
                  
                  {/* Completed badge */}
                  {isCompleted && (
                    <div className="absolute top-4 left-4 px-3 py-1 bg-green-500 text-white rounded-full text-xs font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Completed
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{exercise.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exercise.duration}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500 capitalize">{exercise.category}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{exercise.description}</p>
                  
                  <button
                    onClick={() => startExercise(exercise.id)}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Start Exercise
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      ) : (
        /* Active Exercise View */
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-3xl mx-auto"
          >
            {(() => {
              const exercise = exercises.find(e => e.id === activeExercise)
              if (!exercise) return null
              const Icon = exercise.icon
              
              return (
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                  {/* Exercise Header */}
                  <div className={`bg-gradient-to-br ${exercise.gradient} p-8 text-white relative`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <Icon className="w-64 h-64" />
                    </div>
                    
                    <div className="relative z-10">
                      <h2 className="text-3xl font-light mb-2">{exercise.name}</h2>
                      <p className="text-white/80">{exercise.description}</p>
                    </div>
                  </div>
                  
                  {/* Progress Section */}
                  <div className="p-8">
                    {/* Timer and Controls */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="text-4xl font-light text-gray-900">
                        {formatTime(sessionTime)}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        
                        <button
                          onClick={togglePlayPause}
                          className="p-3 rounded-lg bg-gray-900 text-white hover:bg-gray-800"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </button>
                        
                        <button
                          onClick={resetExercise}
                          className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gray-600 to-gray-900"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-2">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                    
                    {/* Steps */}
                    {exercise.steps && (
                      <div className="space-y-3">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Steps</h3>
                        {exercise.steps.map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`
                              flex items-center gap-4 p-4 rounded-xl border
                              ${index === currentStep 
                                ? 'border-gray-900 bg-gray-50' 
                                : index < currentStep
                                  ? 'border-gray-200 bg-gray-50 opacity-50'
                                  : 'border-gray-200'
                              }
                            `}
                          >
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                              ${index === currentStep 
                                ? 'bg-gray-900 text-white' 
                                : index < currentStep
                                  ? 'bg-gray-300 text-white'
                                  : 'bg-gray-100 text-gray-400'
                              }
                            `}>
                              {index + 1}
                            </div>
                            <span className={index === currentStep ? 'text-gray-900 font-medium' : 'text-gray-600'}>
                              {step}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Complete Button */}
                    {progress >= 100 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                      >
                        <button
                          onClick={completeExercise}
                          className="w-full py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                        >
                          Complete Exercise
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              )
            })()}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}