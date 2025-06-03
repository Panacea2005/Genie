"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
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
  Star
} from 'lucide-react'

// This would typically come from a data file or API
const exerciseData = {
  'box-breathing': {
    id: 'box-breathing',
    name: 'Box Breathing',
    description: 'A calming technique to reduce stress and anxiety',
    duration: 240,
    category: 'breathing',
    difficulty: 'beginner',
    color: '#3b82f6',
    icon: Wind,
    steps: [
      'Inhale slowly for 4 seconds',
      'Hold your breath for 4 seconds',
      'Exhale slowly for 4 seconds',
      'Hold empty for 4 seconds'
    ],
    timings: [4, 4, 4, 4]
  },
  '478-breathing': {
    id: '478-breathing',
    name: '4-7-8 Breathing',
    description: 'Natural tranquilizer for the nervous system',
    duration: 180,
    category: 'breathing',
    difficulty: 'intermediate',
    color: '#8b5cf6',
    icon: Waves,
    steps: [
      'Exhale completely',
      'Inhale through nose for 4 seconds',
      'Hold breath for 7 seconds',
      'Exhale through mouth for 8 seconds'
    ],
    timings: [2, 4, 7, 8]
  },
  'body-scan': {
    id: 'body-scan',
    name: 'Quick Body Scan',
    description: 'Release tension and increase body awareness',
    duration: 300,
    category: 'meditation',
    difficulty: 'beginner',
    color: '#ec4899',
    icon: Activity,
    steps: [
      'Focus on your breath',
      'Notice sensations in your head and neck',
      'Relax your shoulders and arms',
      'Release tension in your chest and back',
      'Soften your belly and hips',
      'Relax your legs and feet'
    ],
    timings: [30, 50, 50, 50, 50, 70]
  },
  '5-senses': {
    id: '5-senses',
    name: '5 Senses Grounding',
    description: 'Ground yourself in the present moment',
    duration: 120,
    category: 'grounding',
    difficulty: 'beginner',
    color: '#10b981',
    icon: Flower2,
    steps: [
      'Name 5 things you can see',
      'Name 4 things you can touch',
      'Name 3 things you can hear',
      'Name 2 things you can smell',
      'Name 1 thing you can taste'
    ],
    timings: [30, 25, 20, 15, 10]
  },
  'loving-kindness': {
    id: 'loving-kindness',
    name: 'Loving Kindness',
    description: 'Cultivate compassion for yourself and others',
    duration: 300,
    category: 'meditation',
    difficulty: 'intermediate',
    color: '#f43f5e',
    icon: Heart,
    steps: [
      'May I be happy',
      'May I be healthy',
      'May I be safe',
      'May I live with ease',
      'Extend these wishes to others'
    ],
    timings: [60, 60, 60, 60, 60]
  },
  'mindful-moment': {
    id: 'mindful-moment',
    name: 'Mindful Moment',
    description: 'A brief pause to center yourself',
    duration: 60,
    category: 'mindfulness',
    difficulty: 'beginner',
    color: '#f59e0b',
    icon: Sun,
    steps: [
      'Close your eyes or soften your gaze',
      'Take three deep breaths',
      'Notice how you feel right now',
      'Set an intention for the rest of your day'
    ],
    timings: [10, 20, 20, 10]
  }
}

export default function ExercisePage() {
  const router = useRouter()
  const params = useParams()
  const exerciseId = params.id as string
  const exercise = exerciseData[exerciseId as keyof typeof exerciseData]

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [sessionTime, setSessionTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'pause'>('inhale')
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isPlaying && exercise) {
      interval = setInterval(() => {
        setSessionTime(prev => {
          const next = prev + 1
          setProgress((next / exercise.duration) * 100)
          
          // Auto-advance steps based on timings
          if (exercise.timings) {
            let accumulatedTime = 0
            for (let i = 0; i < exercise.timings.length; i++) {
              accumulatedTime += exercise.timings[i]
              if (next <= accumulatedTime) {
                setCurrentStep(i)
                
                // Update breath phase for breathing exercises
                if (exercise.category === 'breathing') {
                  const phases: ('inhale' | 'hold' | 'exhale' | 'pause')[] = ['inhale', 'hold', 'exhale', 'pause']
                  setBreathPhase(phases[i % 4])
                }
                break
              }
            }
          }
          
          // Complete exercise when time is up
          if (next >= exercise.duration) {
            completeExercise()
          }
          return next
        })
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isPlaying, exercise])

  const handleBack = () => {
    router.push('/dashboard')
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  const resetExercise = () => {
    setIsPlaying(false)
    setProgress(0)
    setCurrentStep(0)
    setSessionTime(0)
    setBreathPhase('inhale')
    setIsCompleted(false)
  }

  const completeExercise = () => {
    setIsPlaying(false)
    setIsCompleted(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!exercise) {
    return <div>Exercise not found</div>
  }

  const Icon = exercise.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      {/* Back button */}
      <motion.button
        onClick={handleBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ x: -5 }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-light">Back to Wellness</span>
      </motion.button>

      <div className="max-w-2xl mx-auto">
        <motion.div
          className="bg-white/40 backdrop-blur-sm rounded-3xl border border-white/50 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Exercise Header */}
          <div className="p-8 pb-0">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: isPlaying ? 360 : 0 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Icon 
                    className="w-10 h-10" 
                    style={{ color: exercise.color }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-light text-gray-800">{exercise.name}</h1>
                  <p className="text-sm text-gray-600 font-light mt-1">{exercise.description}</p>
                </div>
              </div>
            </div>
            
            {/* Exercise info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 font-light">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTime(exercise.duration)}
              </span>
              <span>•</span>
              <span className="capitalize">{exercise.difficulty}</span>
              <span>•</span>
              <span className="capitalize">{exercise.category}</span>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="p-8">
            {/* Breathing Animation for breathing exercises */}
            {exercise.category === 'breathing' && (
              <div className="flex flex-col items-center mb-8">
                <motion.div
                  className="w-40 h-40 rounded-full flex items-center justify-center mb-6"
                  style={{ 
                    background: `radial-gradient(circle, ${exercise.color}20, ${exercise.color}10)`,
                    border: `2px solid ${exercise.color}40`
                  }}
                  animate={{
                    scale: breathPhase === 'inhale' ? 1.3 : breathPhase === 'exhale' ? 0.8 : 1,
                  }}
                  transition={{ duration: exercise.timings?.[currentStep] || 4, ease: "easeInOut" }}
                >
                  <span className="text-lg text-gray-600 font-light capitalize">{breathPhase}</span>
                </motion.div>
                {isPlaying && (
                  <motion.div 
                    className="text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <p className="text-gray-600 font-light">
                      {exercise.steps?.[currentStep]}
                    </p>
                  </motion.div>
                )}
              </div>
            )}
            
            {/* Timer and Progress */}
            <div className="text-center mb-8">
              <div className="text-5xl font-light text-gray-800 mb-6">
                {formatTime(sessionTime)}
              </div>
              
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: exercise.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              
              {/* Controls */}
              {!isCompleted ? (
                <div className="flex items-center justify-center gap-4">
                  <motion.button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-3 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 hover:bg-white/70 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5 text-gray-600" /> : <Volume2 className="w-5 h-5 text-gray-600" />}
                  </motion.button>
                  
                  <motion.button
                    onClick={togglePlayPause}
                    className="p-5 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-all shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-0.5" />}
                  </motion.button>
                  
                  <motion.button
                    onClick={resetExercise}
                    className="p-3 rounded-full bg-white/50 backdrop-blur-sm border border-white/60 hover:bg-white/70 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RotateCcw className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="flex items-center justify-center gap-2 text-emerald-600 mb-6">
                    <Star className="w-6 h-6" />
                    <span className="text-xl font-medium">Exercise Complete!</span>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={resetExercise}
                      className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={handleBack}
                      className="block w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Back to exercises
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Steps for non-breathing exercises */}
            {exercise.steps && exercise.category !== 'breathing' && !isCompleted && (
              <div className="space-y-2">
                {exercise.steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      flex items-center gap-3 p-3 rounded-2xl transition-all
                      ${index === currentStep 
                        ? 'bg-white/50 backdrop-blur-sm border border-white/60' 
                        : index < currentStep
                          ? 'opacity-50'
                          : 'opacity-30'
                      }
                    `}
                  >
                    <Circle 
                      className={`w-2 h-2 transition-all ${
                        index === currentStep ? 'text-gray-800' : 'text-gray-400'
                      }`} 
                      fill={index <= currentStep ? 'currentColor' : 'none'}
                    />
                    <span className={`text-sm font-light ${
                      index === currentStep ? 'text-gray-800' : 'text-gray-600'
                    }`}>
                      {step}
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}