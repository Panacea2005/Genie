"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/contexts/AuthContext'
import { 
  WellnessService, 
  WellnessExercise 
} from '@/lib/services/wellnessService'
import Navbar from '@/components/navbar'
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
  Heart,
  Waves,
  Circle,
  ArrowLeft,
  Star,
  CheckCircle,
  Loader2,
  AlertCircle,
  Zap
} from 'lucide-react'

// Icon mapping for exercises
const iconMap: { [key: string]: React.ComponentType<React.SVGProps<SVGSVGElement>> } = {
  'Wind': Wind,
  'Activity': Activity,
  'Flower2': Flower2,
  'Sun': Sun,
  'Heart': Heart,
  'Waves': Waves,
  'Star': Star,
  'Zap': Zap,
  'Clock': Clock
}

// Exercise instruction templates based on category
const getExerciseInstructions = (exercise: WellnessExercise) => {
  const duration = exercise.duration_seconds
  
  switch (exercise.category) {
    case 'breathing':
      if (exercise.name.includes('Box')) {
        return {
          steps: [
            'Inhale slowly for 4 seconds',
            'Hold your breath for 4 seconds', 
            'Exhale slowly for 4 seconds',
            'Hold empty for 4 seconds'
          ],
          timings: [4, 4, 4, 4],
          cycleTime: 16
        }
      } else if (exercise.name.includes('4-7-8')) {
        return {
          steps: [
            'Exhale completely',
            'Inhale through nose for 4 seconds',
            'Hold breath for 7 seconds', 
            'Exhale through mouth for 8 seconds'
          ],
          timings: [2, 4, 7, 8],
          cycleTime: 21
        }
      } else {
        return {
          steps: [
            'Take a deep breath in',
            'Hold for a moment',
            'Breathe out slowly',
            'Rest and repeat'
          ],
          timings: [4, 2, 6, 2],
          cycleTime: 14
        }
      }

    case 'meditation':
      if (exercise.name.includes('Body Scan')) {
        return {
          steps: [
            'Focus on your breath',
            'Notice sensations in your head and neck',
            'Relax your shoulders and arms', 
            'Release tension in your chest and back',
            'Soften your belly and hips',
            'Relax your legs and feet'
          ],
          timings: [30, 50, 50, 50, 50, 70],
          cycleTime: 300
        }
      } else if (exercise.name.includes('Loving Kindness')) {
        return {
          steps: [
            'Send loving kindness to yourself',
            'Extend love to someone close to you',
            'Send compassion to a neutral person', 
            'Offer kindness to someone difficult',
            'Radiate love to all beings everywhere'
          ],
          timings: [60, 60, 60, 60, 60],
          cycleTime: 300
        }
      } else {
        return {
          steps: [
            'Settle into a comfortable position',
            'Focus on your natural breath',
            'Notice thoughts without judgment',
            'Return attention to breathing',
            'Rest in awareness'
          ],
          timings: [40, 60, 60, 60, 40],
          cycleTime: 260
        }
      }

    case 'grounding':
      if (exercise.name.includes('5 Senses')) {
        return {
          steps: [
            'Name 5 things you can see',
            'Name 4 things you can touch',
            'Name 3 things you can hear',
            'Name 2 things you can smell', 
            'Name 1 thing you can taste'
          ],
          timings: [30, 25, 20, 15, 10],
          cycleTime: 100
        }
      } else if (exercise.name.includes('54321')) {
        return {
          steps: [
            'Notice 5 things you can see',
            'Notice 4 things you can touch',
            'Notice 3 things you can hear', 
            'Notice 2 things you can smell',
            'Notice 1 thing you can taste'
          ],
          timings: [36, 36, 36, 36, 36],
          cycleTime: 180
        }
      } else {
        return {
          steps: [
            'Feel your feet on the ground',
            'Notice your breathing',
            'Observe your surroundings',
            'Connect with the present moment'
          ],
          timings: [30, 30, 30, 30],
          cycleTime: 120
        }
      }

    case 'mindfulness':
      return {
        steps: [
          'Bring attention to the present',
          'Notice without judgment',
          'Observe thoughts and feelings',
          'Return to mindful awareness'
        ],
        timings: [15, 15, 15, 15],
        cycleTime: 60
      }

    case 'stress-relief':
      return {
        steps: [
          'Tense your muscles',
          'Hold the tension',
          'Release and relax',
          'Notice the relief'
        ],
        timings: [5, 3, 5, 7],
        cycleTime: 20
      }

    case 'focus':
      return {
        steps: [
          'Choose a focal point',
          'Concentrate your attention',
          'When mind wanders, gently return',
          'Deepen your focus'
        ],
        timings: [30, 60, 30, 60],
        cycleTime: 180
      }

    default:
      return {
        steps: [
          'Begin your practice',
          'Stay present and focused',
          'Continue with awareness',
          'Complete your session'
        ],
        timings: [duration/4, duration/4, duration/4, duration/4],
        cycleTime: duration
      }
  }
}

export default function ExercisePage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const exerciseId = params.id as string

  // Exercise data state
  const [exercise, setExercise] = useState<WellnessExercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Timer and session state
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)
  const [currentStepTime, setCurrentStepTime] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)

  // Completion form state
  const [rating, setRating] = useState(4)
  const [notes, setNotes] = useState('')
  const [moodAfter, setMoodAfter] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Exercise instructions
  const [instructions, setInstructions] = useState<{
    steps: string[]
    timings: number[]
    cycleTime: number
  } | null>(null)

  // Load exercise data
  useEffect(() => {
    const loadExercise = async () => {
      try {
        setLoading(true)
        setError(null)

        const result = await WellnessService.getWellnessExercises()
        if (result.error) {
          throw new Error(result.error)
        }

        const foundExercise = result.data?.find(ex => ex.id === exerciseId)
        if (!foundExercise) {
          throw new Error('Exercise not found')
        }

        setExercise(foundExercise)
        const exerciseInstructions = getExerciseInstructions(foundExercise)
        setInstructions(exerciseInstructions)

      } catch (err: any) {
        console.error('Error loading exercise:', err)
        setError(err.message || 'Failed to load exercise')
      } finally {
        setLoading(false)
      }
    }

    if (exerciseId) {
      loadExercise()
    }
  }, [exerciseId])

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isActive && !isPaused && exercise && instructions) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newTime = prev + 1
          
          // Update step progression for guided exercises
          if (instructions.timings.length > 1) {
            let totalTime = 0
            let stepIndex = 0
            
            for (let i = 0; i < instructions.timings.length; i++) {
              if (newTime >= totalTime && newTime < totalTime + instructions.timings[i]) {
                stepIndex = i
                setCurrentStep(i)
                setCurrentStepTime(newTime - totalTime)
                break
              }
              totalTime += instructions.timings[i]
            }
            
            // Check if cycle is complete for repeating exercises
            if (newTime >= instructions.cycleTime && exercise.duration_seconds > instructions.cycleTime) {
              // Reset to beginning of cycle for breathing/repeating exercises
              if (exercise.category === 'breathing' || exercise.category === 'stress-relief') {
                setCurrentStep(0)
                setCurrentStepTime(0)
                return newTime
              }
            }
          }

          // Check if exercise is complete
          if (newTime >= exercise.duration_seconds) {
            setIsActive(false)
            setIsCompleted(true)
          }

          return newTime
        })
      }, 1000)
    } else if (!isActive) {
      if (interval) clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isActive, isPaused, exercise, instructions])

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(!isPaused)
  }

  const handleReset = () => {
    setIsActive(false)
    setIsPaused(false)
    setTimeElapsed(0)
    setCurrentStep(0)
    setCurrentStepTime(0)
    setIsCompleted(false)
  }

  const handleComplete = async () => {
    if (!user?.id || !exercise) return

    try {
      setSubmitting(true)

      const result = await WellnessService.completeExercise(user.id, exercise.id, {
        actualDurationSeconds: timeElapsed,
        notes: notes.trim() || undefined,
        moodAfter: moodAfter || undefined,
        rating: rating
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Navigate back to wellness tab
      router.push('/dashboard?tab=wellness')

    } catch (err: any) {
      console.error('Error completing exercise:', err)
      setError(err.message || 'Failed to save completion')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    if (!exercise) return 0
    return Math.min((timeElapsed / exercise.duration_seconds) * 100, 100)
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Ambient particles effect */}
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              }}
              animate={{
                y: [null, -20, 20],
                x: [null, -10, 10],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-50">
          <Navbar currentPage="dashboard" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-500 font-light">Loading exercise...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !exercise || !instructions) {
    return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Ambient particles effect */}
        <div className="fixed inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              initial={{ 
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
              }}
              animate={{
                y: [null, -20, 20],
                x: [null, -10, 10],
              }}
              transition={{
                duration: 10 + Math.random() * 10,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut",
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
        
        <div className="relative z-50">
          <Navbar currentPage="dashboard" />
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-light text-gray-800 mb-2">Exercise Not Found</h2>
            <p className="text-gray-500 font-light mb-6">
              {error || 'The requested exercise could not be loaded.'}
            </p>
            <button 
              onClick={() => router.push('/dashboard?tab=wellness')}
              className="px-6 py-3 bg-white/30 backdrop-blur-sm border border-white/20 text-gray-700 rounded-xl hover:bg-white/50 transition-colors"
            >
              Back to Wellness
            </button>
          </div>
        </div>
      </div>
    )
  }

  const Icon = iconMap[exercise.icon_name] || Heart

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Ambient particles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, -20, 20],
              x: [null, -10, 10],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
      
      {/* Navigation - Fixed at top */}
      <div className="relative z-50">
        <Navbar currentPage="dashboard" />
      </div>

      {/* Header */}
      <div className="bg-white/30 backdrop-blur-sm border-b border-white/20 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/dashboard?tab=wellness')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-light">Back to Wellness</span>
            </button>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/20">
                <Icon className="w-5 h-5" style={{ color: exercise.color }} />
              </div>
              <span className="font-medium text-gray-800">{exercise.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        <div className="relative z-10 h-full overflow-y-auto">
          <div className="p-8 lg:p-12 max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              {!isCompleted ? (
                // Exercise Session
                <motion.div
                  key="session"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center"
                >
                  {/* Exercise Info */}
                  <div className="mb-12">
                    <div 
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 bg-white/30 backdrop-blur-sm border border-white/20"
                      style={{ backgroundColor: `${exercise.color}20` }}
                    >
                      <Icon className="w-10 h-10" style={{ color: exercise.color }} />
                    </div>
                    
                    <h1 className="text-3xl font-light text-gray-800 mb-4">{exercise.name}</h1>
                    <p className="text-gray-600 font-light max-w-2xl mx-auto mb-6">
                      {exercise.description}
                    </p>
                    
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {WellnessService.formatDuration(exercise.duration_seconds)}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{exercise.difficulty}</span>
                      <span>•</span>
                      <span>{WellnessService.getCategoryDisplayName(exercise.category)}</span>
                    </div>
                  </div>

                  {/* Timer Display */}
                  <div className="mb-12">
                    <div className="relative inline-block">
                      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 120 120">
                        {/* Background circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth="8"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          fill="none"
                          stroke={exercise.color}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 54}`}
                          strokeDashoffset={`${2 * Math.PI * 54 * (1 - getProgress() / 100)}`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-4xl font-light text-gray-800 mb-1">
                          {formatTime(timeElapsed)}
                        </div>
                        <div className="text-sm text-gray-500">
                          / {formatTime(exercise.duration_seconds)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Current Step */}
                  {instructions.steps.length > 1 && isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-12"
                    >
                      <div className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-md mx-auto">
                        <div className="text-sm text-gray-500 mb-2">
                          Step {currentStep + 1} of {instructions.steps.length}
                        </div>
                        <div className="text-xl font-light text-gray-800 mb-4">
                          {instructions.steps[currentStep]}
                        </div>
                        
                        {/* Step progress bar */}
                        <div className="w-full bg-gray-200/50 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-1000"
                            style={{ 
                              backgroundColor: exercise.color,
                              width: `${Math.min((currentStepTime / instructions.timings[currentStep]) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-6">
                    {!isActive ? (
                      <motion.button
                        onClick={handleStart}
                        className="flex items-center justify-center w-16 h-16 rounded-full bg-white/40 backdrop-blur-sm border border-white/20 text-gray-700 hover:bg-white/60 transition-colors shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Play className="w-8 h-8 ml-1" />
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          onClick={handlePause}
                          className="flex items-center justify-center w-14 h-14 rounded-full bg-white/40 backdrop-blur-sm border border-white/20 text-gray-700 hover:bg-white/60 transition-colors shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {isPaused ? <Play className="w-6 h-6 ml-0.5" /> : <Pause className="w-6 h-6" />}
                        </motion.button>
                        
                        <motion.button
                          onClick={handleReset}
                          className="flex items-center justify-center w-14 h-14 rounded-full bg-white/40 backdrop-blur-sm border border-white/20 text-gray-700 hover:bg-white/60 transition-colors shadow-lg"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <RotateCcw className="w-6 h-6" />
                        </motion.button>
                      </>
                    )}

                    <motion.button
                      onClick={() => setAudioEnabled(!audioEnabled)}
                      className="flex items-center justify-center w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm border border-white/20 text-gray-600 hover:bg-white/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </motion.button>
                  </div>

                  {/* Early completion option */}
                  {isActive && timeElapsed >= 30 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8"
                    >
                      <button
                        onClick={() => setIsCompleted(true)}
                        className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-light"
                      >
                        Finish early and save progress
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                // Completion Form
                <motion.div
                  key="completion"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="max-w-md mx-auto"
                >
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100/50 backdrop-blur-sm border border-emerald-200/50 mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-light text-gray-800 mb-2">Well Done!</h2>
                    <p className="text-gray-600 font-light">
                      You completed {exercise.name} in {formatTime(timeElapsed)}
                    </p>
                  </div>

                  <div className="bg-white/30 backdrop-blur-sm rounded-2xl border border-white/20 p-6 space-y-6">
                    {/* Rating */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        How was your session?
                      </label>
                      <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className="p-1"
                          >
                            <Star 
                              className={`w-8 h-8 transition-colors ${star <= rating ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mood After */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        How do you feel now?
                      </label>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {['calm', 'peaceful', 'refreshed', 'centered', 'relaxed', 'energized'].map((mood) => (
                          <button
                            key={mood}
                            onClick={() => setMoodAfter(mood)}
                            className={`p-2 rounded-lg border transition-colors capitalize ${
                              moodAfter === mood 
                                ? 'border-indigo-500 bg-indigo-50/50 text-indigo-700'
                                : 'border-white/30 bg-white/20 hover:border-white/50 hover:bg-white/30'
                            }`}
                          >
                            {mood}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="How did this session feel? Any insights or observations..."
                        className="w-full p-3 border border-white/30 bg-white/20 backdrop-blur-sm rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none placeholder-gray-500"
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      onClick={handleComplete}
                      disabled={submitting}
                      className="w-full py-3 bg-white/40 backdrop-blur-sm border border-white/30 text-gray-700 rounded-lg hover:bg-white/60 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Complete Session'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}