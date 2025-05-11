"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingAnimation() {
  const [showAnimation, setShowAnimation] = useState(true)
  const [animationPhase, setAnimationPhase] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Animation tracking
  const [progress, setProgress] = useState(0)
  const [colorProgress, setColorProgress] = useState(0)
  
  // Track animation frame and timeouts for cleanup
  const animationFrameRef = useRef<number | null>(null)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Smooth color transition animation
  useEffect(() => {
    const colorDuration = 12000
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

  // Main animation sequence with precisely designed phases
  useEffect(() => {
    const phaseDuration = 2000 // 2 seconds per phase
    const phaseCount = 6 // total number of phases
    const totalDuration = phaseDuration * phaseCount
    const startTime = Date.now()

    const updateAnimation = () => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / totalDuration, 1)
      setProgress(newProgress)

      // Calculate current phase (0-5)
      const currentPhase = Math.min(Math.floor(newProgress * phaseCount), phaseCount - 1)
      
      if (currentPhase !== animationPhase) {
        setAnimationPhase(currentPhase)
        
        // Log phase changes for debugging
        console.log(`Animation phase changed to: ${currentPhase} at progress: ${newProgress.toFixed(2)}`)
        
        // If final phase reached, prepare to end animation
        if (currentPhase === phaseCount - 1) {
          const timeout = setTimeout(() => {
            setShowAnimation(false)
          }, phaseDuration)
          timeoutsRef.current.push(timeout)
        }
      }

      if (newProgress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateAnimation)
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAnimation)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      timeoutsRef.current.forEach(clearTimeout)
    }
  }, [animationPhase])

  // Particle generator for flower pattern
  const createParticles = (count: number) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      scale: 0.2 + Math.random() * 0.8,
      x: Math.random() * 250 - 125,
      y: Math.random() * 250 - 125,
      rotation: Math.random() * 360,
      opacity: 0.3 + Math.random() * 0.7,
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 1.5,
    }))
  }
  
  const particles = createParticles(30)

  // Background particles for fullscreen phase
  const backgroundParticles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    size: 10 + Math.random() * 40,
    positions: [
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 },
      { x: Math.random() * 100, y: Math.random() * 100 }
    ],
    delay: Math.random() * 2,
    duration: 8 + Math.random() * 7,
  }))

  // Dynamic gradient styles
  const getSphereStyle = () => {
    // Base sphere size based on phase
    const size = animationPhase === 3 ? 240 : 32 // px

    // Base styles
    return {
      width: `${size}px`,
      height: `${size}px`,
      background: `radial-gradient(circle, 
        rgba(188,212,255,1) 0%, 
        rgba(222,187,255,0.8) 55%, 
        rgba(252,187,227,0.6) 100%)`,
      filter: `blur(${4 + Math.sin(colorProgress * Math.PI * 4) * 2}px)`,
      boxShadow: '0 0 60px rgba(255, 255, 255, 0.3)',
      transition: 'all 2s cubic-bezier(0.34, 1.56, 0.64, 1)'
    }
  }

  // Custom animations for each phase
  const getFlowerAnimation = () => {
    switch (animationPhase) {
      case 0: // Initial appear
        return { 
          opacity: [0, 1], 
          scale: [0.2, 1], 
          rotate: [-30, 0],
          transition: { duration: 2, ease: [0.34, 1.56, 0.64, 1] }
        }
      case 1: // Rotate
        return { 
          opacity: 1, 
          scale: 1, 
          rotate: [0, 360],
          transition: { duration: 2, ease: "easeInOut" }
        }
      case 2: // Shrink to nothing
        return { 
          opacity: [1, 0.7, 0.3, 0], 
          scale: [1, 0.8, 0.4, 0], 
          rotate: [0, 120, 240, 360],
          transition: { duration: 2, ease: "easeInOut" }
        }
      default: 
        return { opacity: 0, scale: 0 }
    }
  }

  const getSphereAnimation = () => {
    switch (animationPhase) {
      case 3: // Emerge
        return { 
          opacity: [0, 0.5, 1], 
          scale: [0, 0.5, 1],
          transition: { 
            duration: 2, 
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.3, 1]
          }
        }
      case 4: // Expand to fullscreen
        return { 
          opacity: [1, 0.8, 0.4, 0], 
          scale: [1, 5, 12, 20],
          transition: { 
            duration: 2, 
            ease: [0.23, 1, 0.32, 1],
            times: [0, 0.3, 0.7, 1]
          }
        }
      default:
        return { opacity: 0, scale: 0 }
    }
  }

  // Special styles for fullscreen gradient
  const getFullscreenStyle = () => {
    return {
      opacity: animationPhase === 4 ? 1 : animationPhase === 5 ? 0.7 : 0,
      background: `linear-gradient(${135 + colorProgress * 90}deg, 
        rgba(252,187,227,0.4) 0%, 
        rgba(222,187,255,0.3) 50%, 
        rgba(188,212,255,0.2) 100%)`,
      transition: 'opacity 2s ease-in-out'
    }
  }

  // Final white overlay style
  const getFinalOverlayStyle = () => {
    return {
      opacity: animationPhase === 5 ? 1 : 0,
      background: 'radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
      transition: 'opacity 2s ease-in-out'
    }
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
          transition={{ duration: 0.8 }}
        >
          {/* PHASE 0-2: Flower pattern */}
          <motion.div
            className="absolute w-40 h-40 z-10"
            initial={{ opacity: 0, scale: 0.2, rotate: -30 }}
            animate={getFlowerAnimation()}
          >
            <Image
              src="/images/flower-pattern.png"
              alt="Flower pattern"
              width={200}
              height={200}
              className="w-full h-full"
              style={{ 
                filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
              }}
            />
            
            {/* Particle effect */}
            <div className="absolute inset-0">
              {particles.map((particle) => (
                <motion.div
                  key={particle.id}
                  className="absolute w-3 h-3 rounded-full bg-white"
                  style={{
                    width: 2 + Math.random() * 4,
                    height: 2 + Math.random() * 4,
                  }}
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
                    scale: animationPhase < 3 ? particle.scale : 0,
                    opacity: animationPhase < 3 ? [0, particle.opacity, 0] : 0,
                    rotate: particle.rotation 
                  }}
                  transition={{ 
                    duration: particle.duration, 
                    ease: "easeOut",
                    delay: particle.delay,
                    repeat: Infinity,
                    repeatType: "loop"
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* PHASE 3-4: Sphere */}
          <motion.div
            className="absolute rounded-full z-20"
            style={getSphereStyle()}
            initial={{ opacity: 0, scale: 0 }}
            animate={getSphereAnimation()}
          >
            {/* Inner pulse effect */}
            {(animationPhase === 3 || animationPhase === 4) && (
              <>
                <motion.div 
                  className="absolute inset-0 rounded-full bg-white/30"
                  animate={{
                    scale: [0.7, 1.2, 0.7],
                    opacity: [0.1, 0.5, 0.1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <motion.div 
                  className="absolute inset-0 rounded-full bg-white/10"
                  animate={{
                    scale: [0.5, 1.3, 0.5],
                    opacity: [0.1, 0.3, 0.1]
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                />
                
                {/* Light reflection */}
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%)"
                  }}
                  animate={{
                    rotate: 360
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </>
            )}
          </motion.div>

          {/* PHASE 4-5: Fullscreen gradient */}
          <motion.div 
            className="absolute inset-0 z-30"
            style={getFullscreenStyle()}
          >
            {/* Floating light particles */}
            {backgroundParticles.map((particle, i) => (
              <motion.div 
                key={i}
                className="absolute rounded-full bg-white/60 blur-md"
                style={{
                  width: particle.size,
                  height: particle.size,
                }}
                initial={{
                  x: `${particle.positions[0].x}%`,
                  y: `${particle.positions[0].y}%`,
                  opacity: 0,
                }}
                animate={
                  animationPhase >= 4 ? {
                    x: [
                      `${particle.positions[0].x}%`, 
                      `${particle.positions[1].x}%`, 
                      `${particle.positions[2].x}%`
                    ],
                    y: [
                      `${particle.positions[0].y}%`, 
                      `${particle.positions[1].y}%`, 
                      `${particle.positions[2].y}%`
                    ],
                    opacity: [0, 0.5, 0],
                    scale: [0.8, 1.2, 0.8]
                  } : { opacity: 0 }
                }
                transition={{
                  duration: particle.duration,
                  ease: "easeInOut",
                  delay: particle.delay
                }}
              />
            ))}
          </motion.div>
          
          {/* PHASE 5: Final white overlay */}
          <motion.div 
            className="absolute inset-0 z-40"
            style={getFinalOverlayStyle()}
          />
          
          {/* Debug indicator - remove in production */}
          {/* <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded-md text-xs z-50">
            Phase: {animationPhase} | Progress: {(progress * 100).toFixed(0)}%
          </div> */}
        </motion.div>
      )}
    </AnimatePresence>
  )
}