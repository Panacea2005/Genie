"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import Image from "next/image"
import { motion, AnimatePresence, useAnimation } from "framer-motion"

export default function LoadingAnimation() {
  // Animation state management
  const [showAnimation, setShowAnimation] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Advanced animation controls
  const flowerControls = useAnimation()
  const sphereControls = useAnimation()
  const pulseControls = useAnimation()
  const backgroundControls = useAnimation()
  const overlayControls = useAnimation()
  const logoControls = useAnimation()
  const particleControls = useAnimation()
  
  // Color transition state
  const [colorProgress, setColorProgress] = useState(0)
  
  // Animation timeouts for cleanup
  const timeoutsRef = useRef<Array<NodeJS.Timeout>>([])
  const animationFrameRef = useRef<number | null>(null)
  
  // Generate particles with fixed seed to avoid hydration mismatch
  const particles = useMemo(() => {
    const particleCount = 30
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    
    return Array.from({ length: particleCount }).map((_, i) => {
      const seed = i * 1.1
      return {
        id: i,
        scale: 0.2 + seededRandom(seed) * 0.8,
        x: seededRandom(seed + 1) * 250 - 125,
        y: seededRandom(seed + 2) * 250 - 125,
        rotation: seededRandom(seed + 3) * 360,
        opacity: 0.3 + seededRandom(seed + 4) * 0.7,
        delay: seededRandom(seed + 5) * 1.5,
        duration: 2 + seededRandom(seed + 6) * 1.5,
        size: 2 + seededRandom(seed + 7) * 4,
      }
    })
  }, [])

  // Generate floating particles with fixed seed
  const floatingParticles = useMemo(() => {
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }
    
    return Array.from({ length: 12 }).map((_, i) => {
      const seed = (i + 100) * 1.3
      return {
        id: i,
        size: 10 + seededRandom(seed) * 40,
        initialX: seededRandom(seed + 1) * 100,
        initialY: seededRandom(seed + 2) * 100,
        midX: seededRandom(seed + 3) * 100,
        midY: seededRandom(seed + 4) * 100,
        endX: seededRandom(seed + 5) * 100,
        endY: seededRandom(seed + 6) * 100,
        duration: 8 + seededRandom(seed + 7) * 7,
        delay: seededRandom(seed + 8) * 2,
      }
    })
  }, [])

  // Set mounted state to enable client-only features
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Smooth color transition animation - only on client
  useEffect(() => {
    if (!isMounted) return

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
  }, [isMounted])

  // Main choreographed animation sequence
  useEffect(() => {
    if (!isMounted) return

    const animationSequence = async () => {
      // 1. Start with flower pattern animation
      flowerControls.start({
        opacity: 1,
        scale: 1,
        rotate: 360,
        transition: { 
          opacity: { duration: 1.2, ease: "easeInOut" },
          scale: { duration: 1.5, ease: [0.34, 1.56, 0.64, 1] },
          rotate: { duration: 3, ease: "easeInOut" }
        }
      })
      
      // Start particle effect around flower
      particleControls.start({
        opacity: 1,
        transition: { duration: 1, ease: "easeInOut" }
      })
      
      // Small pause to show flower pattern
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 2000)
        timeoutsRef.current.push(timeout)
      })
      
      // 2. Flower transforms into sphere
      flowerControls.start({
        opacity: [1, 0.7, 0.3, 0],
        scale: [1, 0.9, 0.6, 0.3],
        rotate: 540,
        transition: { 
          duration: 2.5, 
          ease: "easeInOut",
        }
      })
      
      // Sphere emerges from center of flower
      sphereControls.start({
        scale: [0, 0.5, 0.9, 1],
        opacity: [0, 0.3, 0.7, 1],
        transition: { 
          duration: 2.5,
          ease: [0.34, 1.56, 0.64, 1],
          times: [0, 0.2, 0.6, 1]
        }
      })
      
      // Particles gradually fade out
      particleControls.start({
        opacity: [1, 0.7, 0.3, 0],
        scale: [1, 0.8, 0.5, 0.2],
        transition: { 
          duration: 2.5,
          ease: "easeInOut",
        }
      })
      
      // Start pulse effect in sphere
      pulseControls.start({
        scale: [0.8, 1.2, 0.8],
        opacity: [0.3, 0.5, 0.3],
        transition: { 
          duration: 3, 
          ease: "easeInOut",
          repeat: Infinity,
          repeatType: "loop"
        }
      })
      
      // Wait for sphere to fully form
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 2000)
        timeoutsRef.current.push(timeout)
      })
      
      // 3. Sphere expands
      sphereControls.start({
        scale: [1, 1.5, 3, 5, 10],
        opacity: [1, 1, 0.8, 0.5, 0],
        transition: { 
          scale: { 
            duration: 3, 
            ease: [0.23, 1, 0.32, 1],
            times: [0, 0.2, 0.5, 0.8, 1]
          },
          opacity: { 
            duration: 3, 
            ease: "easeInOut",
            times: [0, 0.3, 0.6, 0.8, 1]
          }
        }
      })
      
      // Background gradient fades in
      backgroundControls.start({
        opacity: 1,
        transition: { duration: 2, ease: "easeInOut", delay: 0.5 }
      })
      
      // Wait for sphere expansion
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1500)
        timeoutsRef.current.push(timeout)
      })
      
      // 4. Show Genie logo
      logoControls.start({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { 
          duration: 1, 
          ease: [0.34, 1.56, 0.64, 1]
        }
      })
      
      // Small pause to show logo
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1000)
        timeoutsRef.current.push(timeout)
      })
      
      // 5. Fade to white
      overlayControls.start({
        opacity: 1,
        transition: { duration: 1.8, ease: "easeInOut" }
      })
      
      // Final pause
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1500)
        timeoutsRef.current.push(timeout)
      })
      
      // Animation complete
      setShowAnimation(false)
    }
    
    animationSequence()
    
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isMounted, flowerControls, sphereControls, backgroundControls, overlayControls, pulseControls, logoControls, particleControls])

  // Advanced color interpolation function
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hex2rgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return [r, g, b]
    }
    
    const easedFactor = 0.5 - Math.cos(factor * Math.PI) / 2
    
    const [r1, g1, b1] = hex2rgb(color1)
    const [r2, g2, b2] = hex2rgb(color2)
    
    const r = Math.round(r1 + (r2 - r1) * easedFactor)
    const g = Math.round(g1 + (g2 - g1) * easedFactor)
    const b = Math.round(b1 + (b2 - b1) * easedFactor)
    
    return `rgb(${r}, ${g}, ${b})`
  }
  
  // Dynamic sphere gradient styles - only apply on client
  const sphereGradient = isMounted ? {
    background: `radial-gradient(circle, 
      ${interpolateColor("#c084fc", "#93c5fd", colorProgress)} 0%, 
      ${interpolateColor("#60a5fa", "#818cf8", colorProgress)} 50%, 
      ${interpolateColor("#93c5fd", "#c084fc", colorProgress)} 100%)`,
    filter: `blur(${4 + Math.sin(colorProgress * Math.PI * 4) * 2}px)`,
  } : {
    background: `radial-gradient(circle, #c084fc 0%, #60a5fa 50%, #93c5fd 100%)`,
    filter: `blur(4px)`,
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
          {/* Flower pattern that transforms into sphere */}
          <motion.div
            className="absolute w-40 h-40 z-10"
            initial={{ opacity: 0, scale: 0.2, rotate: -30 }}
            animate={flowerControls}
          >
            <Image
              src="/images/flower-pattern.png"
              alt="Flower pattern"
              width={200}
              height={200}
              className="w-full h-full"
              style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }}
            />
            
            {/* Particle effect around flower - only render on client */}
            {isMounted && (
              <motion.div
                className="absolute w-full h-full"
                initial={{ opacity: 0 }}
                animate={particleControls}
              >
                {particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-white"
                    style={{
                      width: particle.size,
                      height: particle.size,
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ 
                      x: -particle.size / 2, 
                      y: -particle.size / 2, 
                      scale: 0,
                      opacity: 0,
                      rotate: 0 
                    }}
                    animate={{ 
                      x: particle.x - particle.size / 2, 
                      y: particle.y - particle.size / 2, 
                      scale: particle.scale,
                      opacity: [0, particle.opacity, 0],
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
              </motion.div>
            )}
          </motion.div>
          
          {/* Sphere that emerges from flower */}
          <motion.div
            className="absolute rounded-full z-20 w-40 h-40"
            style={sphereGradient}
            initial={{ scale: 0, opacity: 0 }}
            animate={sphereControls}
          >
            {/* Animated inner gradients for depth */}
            <motion.div 
              className="absolute inset-0 rounded-full"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <div 
                className="absolute inset-0 rounded-full" 
                style={{ 
                  background: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)",
                  opacity: 0.7
                }} 
              />
            </motion.div>
            
            {/* Pulse effect */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-white/20"
              initial={{ scale: 0.8, opacity: 0.3 }}
              animate={pulseControls}
            />
            
            {/* Second pulse with offset timing */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-white/10"
              initial={{ scale: 0.8, opacity: 0.2 }}
              animate={{
                scale: [0.6, 1, 0.6],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
          </motion.div>
          
          {/* Genie logo that appears later */}
          <motion.div
            className="absolute z-30"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={logoControls}
          >
            <div className="flex flex-col items-center">
              {/* Mini sphere icon */}
              <div className="w-6 h-6 mb-3 rounded-full relative overflow-hidden" style={{ 
                background: "linear-gradient(135deg, #e0f2ff 0%, #d8d6ff 45%, #f0d5ff 100%)"
              }}>
                <div className="absolute inset-0 rounded-full bg-white/40" style={{ filter: "blur(1px)" }} />
                <div className="absolute top-0 left-0 w-full h-full rounded-full" style={{ 
                  background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.2) 100%)",
                  opacity: 0.7
                }} />
              </div>
              
              {/* Genie text */}
              <div className="text-xl text-white/90 font-light tracking-wide">
                Genie
              </div>
            </div>
          </motion.div>
          
          {/* Background gradient overlay */}
          <motion.div 
            className="absolute inset-0 z-25"
            initial={{ opacity: 0 }}
            animate={backgroundControls}
            style={{
              background: "linear-gradient(135deg, rgba(188,212,255,0.4) 0%, rgba(222,187,255,0.3) 50%, rgba(252,187,227,0.2) 100%)",
            }}
          >
            {/* Floating light particles - only render on client */}
            {isMounted && floatingParticles.map((particle) => (
              <motion.div 
                key={particle.id}
                className="absolute rounded-full bg-white/40"
                style={{
                  width: particle.size,
                  height: particle.size,
                  filter: "blur(8px)"
                }}
                initial={{
                  x: `${particle.initialX}%`,
                  y: `${particle.initialY}%`,
                  opacity: 0,
                }}
                animate={{
                  x: [
                    `${particle.initialX}%`, 
                    `${particle.midX}%`, 
                    `${particle.endX}%`
                  ],
                  y: [
                    `${particle.initialY}%`, 
                    `${particle.midY}%`, 
                    `${particle.endY}%`
                  ],
                  opacity: [0, 0.4, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  ease: "easeInOut",
                  times: [0, 0.5, 1]
                }}
              />
            ))}
          </motion.div>
          
          {/* Final white overlay for transition to app */}
          <motion.div 
            className="absolute inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={overlayControls}
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}