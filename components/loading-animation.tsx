"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingAnimation() {
  const [showAnimation, setShowAnimation] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchBarPositionRef = useRef<HTMLDivElement>(null)
  
  // Enhanced progress tracking with multiple phases
  const [progress, setProgress] = useState(0)
  const [colorProgress, setColorProgress] = useState(0)

  // Define animation timing variables
  const PATTERN_DURATION = 2000
  const SPHERE_DURATION = 2200
  const FULLSCREEN_DURATION = 2400
  const BAR_DURATION = 2000
  const BACKGROUND_TRANSITION = 1800

  // Track animation frame for cleanup
  const animationFrameRef = useRef<number | null>(null)

  // Smooth color transition animation
  useEffect(() => {
    const colorDuration = 12000 // Extended color transition duration
    const startTime = Date.now()

    const updateColorProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed % colorDuration) / colorDuration
      setColorProgress(newProgress)

      animationFrameRef.current = requestAnimationFrame(updateColorProgress)
    }

    animationFrameRef.current = requestAnimationFrame(updateColorProgress)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Main animation sequence
  useEffect(() => {
    // Animation sequence with smoother phase transitions
    const totalDuration = 10000 // 10 seconds total animation
    const startTime = Date.now()

    const updateProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / totalDuration, 1)
      setProgress(newProgress)

      // Update animation phase based on progress
      if (newProgress < 0.2) {
        setAnimationPhase(0) // Pattern phase
      } else if (newProgress < 0.4) {
        setAnimationPhase(1) // Sphere phase
      } else if (newProgress < 0.6) {
        setAnimationPhase(2) // Fullscreen phase
      } else if (newProgress < 0.8) {
        setAnimationPhase(3) // Bar phase
      } else if (newProgress < 1) {
        setAnimationPhase(4) // Background transition phase
      } else {
        setShowAnimation(false)
      }

      if (newProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateProgress)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateProgress)

    // Clean up on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Background color transition effect
  useEffect(() => {
    if (animationPhase === 4 && containerRef.current) {
      containerRef.current.style.transition = `background-color ${BACKGROUND_TRANSITION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
      containerRef.current.style.backgroundColor = 'white'
    }
  }, [animationPhase])

  // Advanced color interpolation function
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    // Convert hex to RGB
    const hex2rgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return [r, g, b]
    }
    
    // Apply easing to factor
    const easedFactor = 0.5 - Math.cos(factor * Math.PI) / 2
    
    // Convert colors and interpolate
    const [r1, g1, b1] = hex2rgb(color1)
    const [r2, g2, b2] = hex2rgb(color2)
    
    const r = Math.round(r1 + (r2 - r1) * easedFactor)
    const g = Math.round(g1 + (g2 - g1) * easedFactor)
    const b = Math.round(b1 + (b2 - b1) * easedFactor)
    
    return `rgb(${r}, ${g}, ${b})`
  }

  // Dynamic gradient styles with advanced color interpolation
  const sphereGradient = {
    background: `radial-gradient(circle, 
      ${interpolateColor("#c084fc", "#93c5fd", colorProgress)} 0%, 
      ${interpolateColor("#60a5fa", "#818cf8", colorProgress)} 50%, 
      ${interpolateColor("#93c5fd", "#c084fc", colorProgress)} 100%)`,
    filter: `blur(${4 + Math.sin(colorProgress * Math.PI * 4) * 2}px)`,
  }

  const fullscreenGradient = {
    background: `linear-gradient(${135 + colorProgress * 90}deg, 
      ${interpolateColor("#ffc2e7", "#bbf7d0", colorProgress)} 0%, 
      ${interpolateColor("#d8b4fe", "#93c5fd", colorProgress)} 50%, 
      ${interpolateColor("#93c5fd", "#ffc2e7", colorProgress)} 100%)`,
  }

  const barGradient = {
    background: `linear-gradient(to right, 
      ${interpolateColor("#ffa6d9", "#60a5fa", colorProgress)} 0%, 
      ${interpolateColor("#60a5fa", "#ffa6d9", colorProgress)} 100%)`,
    boxShadow: `0 0 ${15 + Math.sin(colorProgress * Math.PI * 4) * 10}px ${interpolateColor("#60a5fa", "#ffa6d9", colorProgress)}`,
  }

  // Particle effect for pattern phase
  const ParticleEffect = () => {
    const particleCount = 20
    const particles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      scale: 0.2 + Math.random() * 0.8,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      rotation: Math.random() * 360,
      opacity: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 1,
    }))

    return (
      <div className="absolute w-32 h-32 z-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute w-3 h-3 rounded-full bg-white"
            initial={{ 
              x: 0, 
              y: 0, 
              scale: 0,
              opacity: 0,
              rotate: 0 
            }}
            animate={{ 
              x: particle.x, 
              y: particle.y, 
              scale: particle.scale,
              opacity: [0, particle.opacity, 0],
              rotate: particle.rotation 
            }}
            transition={{ 
              duration: 2 + particle.delay, 
              ease: "easeOut",
              delay: particle.delay,
              repeat: Infinity,
              repeatType: "loop"
            }}
          />
        ))}
      </div>
    )
  }

  if (!showAnimation) {
    return null
  }

  return (
    <AnimatePresence>
      {showAnimation && (
        <motion.div 
          ref={containerRef} 
          className="fixed inset-0 bg-black flex items-center justify-center z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Invisible element to measure search bar position */}
          <div className="absolute inset-0 pointer-events-none opacity-0 flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <div className="flex flex-col items-center max-w-xl w-full">
                <div ref={searchBarPositionRef} className="w-full max-w-[500px] h-12 mt-32"></div>
              </div>
            </div>
          </div>

          {/* Pattern with particles */}
          <motion.div
            className={`absolute w-40 h-40 z-10 ${animationPhase > 0 ? 'pointer-events-none' : ''}`}
            initial={{ opacity: 0, scale: 0.2, rotate: -30 }}
            animate={{ 
              opacity: animationPhase === 0 ? 1 : 0, 
              scale: animationPhase === 0 ? 1 : 0.5,
              rotate: animationPhase === 0 ? 360 : 0
            }}
            transition={{ 
              opacity: { duration: PATTERN_DURATION / 1000 * 0.5, ease: "easeInOut" },
              scale: { duration: PATTERN_DURATION / 1000, ease: [0.34, 1.56, 0.64, 1] },
              rotate: { duration: PATTERN_DURATION / 1000 * 3, ease: "linear", repeat: Infinity }
            }}
          >
            <Image
              src="/images/flower-pattern.png"
              alt="Flower pattern"
              width={200}
              height={200}
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }}
            />
            <ParticleEffect />
          </motion.div>

          {/* Sphere */}
          <motion.div
            style={sphereGradient}
            className="absolute rounded-full z-20"
            initial={{ scale: 0, opacity: 0, width: "32px", height: "32px" }}
            animate={{ 
              scale: animationPhase === 1 ? 1 : animationPhase > 1 ? 20 : 0, 
              opacity: animationPhase === 1 ? 1 : 0,
              width: animationPhase === 1 ? "240px" : "32px",
              height: animationPhase === 1 ? "240px" : "32px",
            }}
            transition={{ 
              scale: { 
                duration: SPHERE_DURATION / 1000, 
                ease: [0.34, 1.56, 0.64, 1]
              },
              opacity: { 
                duration: SPHERE_DURATION / 1000 * 0.6, 
                ease: "easeInOut" 
              },
              width: { 
                duration: SPHERE_DURATION / 1000 * 0.8, 
                ease: [0.34, 1.56, 0.64, 1] 
              },
              height: { 
                duration: SPHERE_DURATION / 1000 * 0.8, 
                ease: [0.34, 1.56, 0.64, 1] 
              }
            }}
          >
            {/* Inner sphere glow effect */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-white/20"
              animate={{
                scale: [0.7, 1, 0.7],
                opacity: [0.1, 0.4, 0.1]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Fullscreen gradient */}
          <motion.div 
            style={fullscreenGradient} 
            className="absolute inset-0 z-30"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: animationPhase === 2 ? 1 : 0
            }}
            transition={{ 
              opacity: { 
                duration: FULLSCREEN_DURATION / 1000 * 0.7, 
                ease: "easeInOut" 
              }
            }}
          >
            <motion.div 
              className="w-full h-full bg-gradient-to-br from-green-200 via-blue-300 to-purple-300 mix-blend-multiply"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%']
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              {/* Floating light particles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div 
                  key={i}
                  className="absolute rounded-full bg-white/60 blur-md"
                  style={{
                    width: 20 + Math.random() * 40,
                    height: 20 + Math.random() * 40,
                  }}
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    opacity: 0.1 + Math.random() * 0.3,
                  }}
                  animate={{
                    x: [
                      `${Math.random() * 100}%`, 
                      `${Math.random() * 100}%`, 
                      `${Math.random() * 100}%`
                    ],
                    y: [
                      `${Math.random() * 100}%`, 
                      `${Math.random() * 100}%`, 
                      `${Math.random() * 100}%`
                    ],
                    opacity: [0.1, 0.5, 0.1]
                  }}
                  transition={{
                    duration: 8 + Math.random() * 7,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: Math.random() * 2
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* Gradient bar - positioned exactly where search bar will be */}
          <motion.div
            style={barGradient}
            className="absolute rounded-full z-40 backdrop-blur-sm"
            initial={{ 
              width: 0, 
              height: "48px", 
              opacity: 0,
              top: "50%",
              left: "50%",
              x: "-50%",
              y: "80px" 
            }}
            animate={{ 
              width: animationPhase >= 3 ? "500px" : 0, 
              opacity: animationPhase === 3 ? 1 : 0,
              scale: animationPhase === 3 ? [0.98, 1.02, 1] : 1
            }}
            transition={{ 
              width: { 
                duration: BAR_DURATION / 1000 * 0.6, 
                ease: [0.34, 1.56, 0.64, 1] 
              },
              opacity: { 
                duration: BAR_DURATION / 1000 * 0.4, 
                ease: "easeInOut" 
              },
              scale: {
                duration: 1.5,
                times: [0, 0.5, 1],
                ease: "easeInOut",
                repeat: animationPhase === 3 ? 2 : 0,
              }
            }}
          >
            {/* Animated shimmer effect */}
            <motion.div
              className="absolute inset-0 overflow-hidden rounded-full"
              initial={{ opacity: 0.6 }}
            >
              <motion.div 
                className="absolute h-full w-40 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                animate={{ x: ["calc(-100%)", "calc(500px + 100%)"] }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  repeatDelay: 0.5
                }}
              />
            </motion.div>
            
            {/* Pulse animation around the bar */}
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0, 0.4, 0],
                scale: [1, 1.15, 1]
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
              style={{
                boxShadow: `0 0 20px ${interpolateColor("#60a5fa", "#ffa6d9", colorProgress)}`
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}