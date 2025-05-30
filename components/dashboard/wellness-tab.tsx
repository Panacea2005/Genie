import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Wind,
  Activity,
  Flower2,
  Sun,
  Clock,
  ChevronLeft,
} from 'lucide-react'

interface Exercise {
  id: string
  name: string
  description: string
  duration: string
  icon: React.ComponentType<React.SVGAttributes<SVGElement>>
  color: string
  steps?: string[]
}

export default function WellnessTab() {
  const [activeExercise, setActiveExercise] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)

  const exercises: Exercise[] = [
    {
      id: 'box-breathing',
      name: 'Box Breathing',
      description: 'A calming technique to reduce stress and anxiety',
      duration: '4 min',
      icon: Wind,
      color: '#3b82f6', // blue-500
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
      description: 'Release tension through mindful awareness',
      duration: '10 min',
      icon: Activity,
      color: '#a855f7', // purple-500
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
      description: 'Quick technique to center yourself',
      duration: '2 min',
      icon: Flower2,
      color: '#10b981', // emerald-500
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
      icon: Sun,
      color: '#f59e0b', // amber-500
      steps: [
        'Start walking at a comfortable pace',
        'Focus on the sensation of your feet',
        'Notice your breath as you move',
        'Observe your surroundings without judgment'
      ]
    }
  ]

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying && activeExercise) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
        // Calculate progress based on exercise duration
        const exercise = exercises.find(e => e.id === activeExercise)
        if (exercise) {
          const totalSeconds = parseInt(exercise.duration) * 60
          setProgress(prev => Math.min((prev + (100 / totalSeconds)), 100))
        }
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isPlaying, activeExercise])

  // Auto advance steps
  useEffect(() => {
    if (isPlaying && activeExercise) {
      const exercise = exercises.find(e => e.id === activeExercise)
      if (exercise?.steps) {
        const stepProgress = 100 / exercise.steps.length
        const nextStepIndex = Math.floor(progress / stepProgress)
        if (nextStepIndex !== currentStep && nextStepIndex < exercise.steps.length) {
          setCurrentStep(nextStepIndex)
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

  const endExercise = () => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentStep(0)
    setSessionTime(0)
    setActiveExercise(null)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div 
        className="mb-16 text-center"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl font-light text-gray-800 mb-2">Wellness Exercises</h1>
        <p className="text-gray-500 font-light text-sm">Take a moment to breathe and relax</p>
      </motion.div>

      {/* Exercise Grid or Active Exercise */}
      <AnimatePresence mode="wait">
        {!activeExercise ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
          >
            {exercises.map((exercise, index) => {
              const Icon = exercise.icon
              
              return (
                <motion.button
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => startExercise(exercise.id)}
                  className="bg-white rounded-2xl p-8 text-left transition-all duration-300 hover:shadow-lg border border-gray-100 group"
                >
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${exercise.color}15` }}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ color: exercise.color }}
                      />
                    </div>
                    <span className="text-sm font-light text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {exercise.duration}
                    </span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-light text-gray-800 mb-2">{exercise.name}</h3>
                  <p className="text-sm font-light text-gray-600 mb-4">{exercise.description}</p>
                  
                  {/* Start indicator */}
                  <div className="flex items-center gap-2 text-sm font-light text-gray-500 group-hover:text-gray-700 transition-colors">
                    <span>Start exercise</span>
                    <Play className="w-3 h-3" />
                  </div>
                </motion.button>
              )
            })}
          </motion.div>
        ) : (
          /* Active Exercise View */
          <motion.div
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl mx-auto"
          >
            {(() => {
              const exercise = exercises.find(e => e.id === activeExercise)
              if (!exercise) return null
              const Icon = exercise.icon
              
              return (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="p-8 border-b border-gray-100">
                    <button
                      onClick={endExercise}
                      className="flex items-center gap-2 text-sm font-light text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back to exercises
                    </button>
                    
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${exercise.color}15` }}
                      >
                        <Icon 
                          className="w-7 h-7" 
                          style={{ color: exercise.color }}
                        />
                      </div>
                      <div>
                        <h2 className="text-xl font-light text-gray-800">{exercise.name}</h2>
                        <p className="text-sm font-light text-gray-500">{exercise.description}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Timer and Progress */}
                  <div className="p-8">
                    {/* Timer Display */}
                    <div className="text-center mb-8">
                      <div className="text-5xl font-light text-gray-800 mb-2">
                        {formatTime(sessionTime)}
                      </div>
                      <div className="text-sm font-light text-gray-500">
                        of {exercise.duration}
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ backgroundColor: exercise.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                    
                    {/* Current Step */}
                    {exercise.steps && (
                      <div className="mb-8">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center"
                          >
                            <div className="text-sm font-light text-gray-500 mb-2">
                              Step {currentStep + 1} of {exercise.steps.length}
                            </div>
                            <div className="text-xl font-light text-gray-800">
                              {exercise.steps[currentStep]}
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    )}
                    
                    {/* Controls */}
                    <div className="flex justify-center">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={togglePlayPause}
                        className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-800 transition-colors"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-0.5" />
                        )}
                      </motion.button>
                    </div>
                    
                    {/* Complete Button */}
                    {progress >= 100 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8"
                      >
                        <button
                          onClick={endExercise}
                          className="w-full py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-light text-sm"
                        >
                          Complete Exercise
                        </button>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Steps Overview */}
                  {exercise.steps && (
                    <div className="px-8 pb-8">
                      <div className="space-y-2">
                        {exercise.steps.map((step, index) => (
                          <div
                            key={index}
                            className={`
                              flex items-center gap-3 p-3 rounded-lg transition-all duration-300
                              ${index === currentStep 
                                ? 'bg-gray-50' 
                                : index < currentStep
                                  ? 'opacity-40'
                                  : 'opacity-40'
                              }
                            `}
                          >
                            <div 
                              className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs
                                transition-all duration-300
                              `}
                              style={{
                                backgroundColor: index <= currentStep ? `${exercise.color}20` : '#f3f4f6',
                                color: index <= currentStep ? exercise.color : '#9ca3af'
                              }}
                            >
                              {index + 1}
                            </div>
                            <span className={`text-sm font-light ${
                              index === currentStep ? 'text-gray-800' : 'text-gray-500'
                            }`}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Today's Practice Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-16 text-center"
      >
        <p className="text-sm font-light text-gray-500">
          Remember to take these moments for yourself throughout the day
        </p>
      </motion.div>
    </div>
  )
}