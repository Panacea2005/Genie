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

  // Enhanced smooth color transition animation with higher frame rate
  useEffect(() => {
    if (!isMounted) return

    const colorDuration = 15000 // Slightly longer for smoother transitions
    const startTime = Date.now()

    const updateColorProgress = () => {
      const elapsed = Date.now() - startTime
      const newProgress = (elapsed % colorDuration) / colorDuration
      // Smoother easing for color transitions
      const easedProgress = 0.5 - Math.cos(newProgress * Math.PI * 2) / 2
      setColorProgress(easedProgress)

      animationFrameRef.current = requestAnimationFrame(updateColorProgress)
    }

    animationFrameRef.current = requestAnimationFrame(updateColorProgress)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isMounted])

  // Enhanced choreographed animation sequence with smoother transitions
  useEffect(() => {
    if (!isMounted) return

    const animationSequence = async () => {
      // 1. Start with flower pattern animation - enhanced smoothness
      flowerControls.start({
        opacity: [0, 0.3, 0.7, 1],
        scale: [0.2, 0.8, 1.1, 1],
        rotate: [0, 180, 360],
        y: [10, -2, 0],
        transition: { 
          duration: 3.5, // Slightly longer for smoother effect
          ease: [0.16, 1, 0.3, 1], // Smoother easing curve
          opacity: { 
            duration: 2, 
            ease: "easeOut",
            times: [0, 0.4, 0.7, 1]
          },
          scale: { 
            duration: 3.5, 
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.5, 0.8, 1]
          },
          rotate: { 
            duration: 3.5, 
            ease: [0.25, 0.46, 0.45, 0.94],
            times: [0, 0.6, 1]
          },
          y: {
            duration: 2.5,
            ease: [0.34, 1.56, 0.64, 1],
            times: [0, 0.7, 1]
          }
        }
      })
      
      // Start particle effect around flower with smoother entrance
      particleControls.start({
        opacity: [0, 1],
        transition: { 
          duration: 1.8, 
          ease: [0.25, 0.46, 0.45, 0.94],
          staggerChildren: 0.05
        }
      })
      
      // Small pause to show flower pattern
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 2200)
        timeoutsRef.current.push(timeout)
      })
      
      // 2. Flower transforms into sphere with enhanced smoothness
      flowerControls.start({
        opacity: [1, 0.8, 0.5, 0.2, 0],
        scale: [1, 1.05, 0.9, 0.6, 0.3],
        rotate: [360, 450, 540],
        y: [0, -5, 0, 5, 0],
        transition: { 
          duration: 3.2, 
          ease: [0.7, 0, 0.84, 0],
          times: [0, 0.2, 0.5, 0.8, 1],
          opacity: { ease: [0.25, 0.46, 0.45, 0.94] },
          scale: { ease: [0.34, 1.56, 0.64, 1] },
          rotate: { ease: "easeInOut" },
          y: { ease: [0.16, 1, 0.3, 1] }
        }
      })
      
      // Sphere emerges from center of flower with enhanced smoothness
      sphereControls.start({
        scale: [0, 0.2, 0.6, 0.9, 1],
        opacity: [0, 0.2, 0.5, 0.8, 1],
        rotate: [0, 90, 180, 270, 360],
        transition: { 
          duration: 3.2,
          ease: [0.16, 1, 0.3, 1],
          times: [0, 0.15, 0.4, 0.7, 1],
          scale: { ease: [0.34, 1.56, 0.64, 1] },
          opacity: { ease: "easeOut" },
          rotate: { ease: [0.25, 0.46, 0.45, 0.94] }
        }
      })
      
      // Particles gradually fade out with smoother transition
      particleControls.start({
        opacity: [1, 0.8, 0.5, 0.2, 0],
        scale: [1, 0.9, 0.7, 0.4, 0.2],
        y: [0, -10, -15, -20, -25],
        transition: { 
          duration: 3.2,
          ease: [0.7, 0, 0.84, 0],
          times: [0, 0.3, 0.6, 0.8, 1],
          opacity: { ease: "easeOut" },
          scale: { ease: [0.25, 0.46, 0.45, 0.94] },
          y: { ease: "easeOut" }
        }
      })
      
      // Start enhanced pulse effect in sphere
      pulseControls.start({
        scale: [0.8, 1.15, 0.95, 1.2, 0.8],
        opacity: [0.3, 0.6, 0.4, 0.7, 0.3],
        transition: { 
          duration: 4, 
          ease: [0.37, 0, 0.63, 1],
          repeat: Infinity,
          repeatType: "loop"
        }
      })
      
      // Wait for sphere to fully form
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 2500)
        timeoutsRef.current.push(timeout)
      })
      
      // 3. Sphere expands with enhanced smoothness
      sphereControls.start({
        scale: [1, 1.3, 2, 3.5, 6, 12],
        opacity: [1, 1, 0.95, 0.8, 0.5, 0],
        rotate: [360, 450, 540, 720, 900, 1080],
        filter: ["blur(0px)", "blur(1px)", "blur(3px)", "blur(8px)", "blur(15px)", "blur(30px)"],
        transition: { 
          duration: 4,
          ease: [0.19, 1, 0.22, 1],
          times: [0, 0.15, 0.3, 0.5, 0.7, 1],
          scale: { ease: [0.25, 0.46, 0.45, 0.94] },
          opacity: { ease: [0.16, 1, 0.3, 1] },
          rotate: { ease: "easeInOut" },
          filter: { ease: "easeOut" }
        }
      })
      
      // Background gradient fades in with smoother transition
      backgroundControls.start({
        opacity: [0, 0.4, 0.8, 1],
        scale: [0.9, 1],
        transition: { 
          duration: 2.8, 
          ease: [0.25, 0.46, 0.45, 0.94], 
          delay: 0.8,
          times: [0, 0.4, 0.7, 1],
          scale: { ease: [0.34, 1.56, 0.64, 1] }
        }
      })
      
      // Wait for sphere expansion
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 2000)
        timeoutsRef.current.push(timeout)
      })
      
      // 4. Show Genie logo with enhanced entrance
      logoControls.start({
        opacity: [0, 0.3, 0.7, 1],
        y: [20, 5, -2, 0],
        scale: [0.8, 1.05, 0.98, 1],
        rotate: [3, -1, 0.5, 0],
        transition: { 
          duration: 2.2, 
          ease: [0.16, 1, 0.3, 1],
          times: [0, 0.4, 0.7, 1],
          opacity: { ease: "easeOut" },
          y: { ease: [0.34, 1.56, 0.64, 1] },
          scale: { ease: [0.25, 0.46, 0.45, 0.94] },
          rotate: { ease: [0.37, 0, 0.63, 1] }
        }
      })
      
      // Small pause to show logo
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1200)
        timeoutsRef.current.push(timeout)
      })
      
      // 5. Fade to white with enhanced smoothness
      overlayControls.start({
        opacity: [0, 0.2, 0.5, 0.8, 1],
        transition: { 
          duration: 2.5, 
          ease: [0.25, 0.46, 0.45, 0.94],
          times: [0, 0.3, 0.5, 0.7, 1]
        }
      })
      
      // Final pause
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 2000)
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

  // Enhanced color interpolation function with smoother transitions
  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hex2rgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return [r, g, b]
    }
    
    // Enhanced easing for smoother color transitions
    const easedFactor = 0.5 - Math.cos(factor * Math.PI) / 2
    
    const [r1, g1, b1] = hex2rgb(color1)
    const [r2, g2, b2] = hex2rgb(color2)
    
    const r = Math.round(r1 + (r2 - r1) * easedFactor)
    const g = Math.round(g1 + (g2 - g1) * easedFactor)
    const b = Math.round(b1 + (b2 - b1) * easedFactor)
    
    return `rgb(${r}, ${g}, ${b})`
  }
  
  // Enhanced dynamic sphere gradient with smoother transitions
  const sphereGradient = isMounted ? {
    background: `radial-gradient(circle, 
      ${interpolateColor("#c084fc", "#93c5fd", colorProgress)} 0%, 
      ${interpolateColor("#60a5fa", "#818cf8", colorProgress)} 50%, 
      ${interpolateColor("#93c5fd", "#c084fc", colorProgress)} 100%)`,
    filter: `blur(${4 + Math.sin(colorProgress * Math.PI * 4) * 2}px)`,
    transform: `scale(${1 + Math.sin(colorProgress * Math.PI * 2) * 0.02})`, // Subtle breathing effect
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
          transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
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
              style={{ 
                filter: `drop-shadow(0 0 12px rgba(255,255,255,0.6)) saturate(${1 + colorProgress * 0.3})`,
              }}
            />
            
            {/* Enhanced particle effect around flower with smoother animations */}
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
                      boxShadow: "0 0 4px rgba(255,255,255,0.8)"
                    }}
                    initial={{ 
                      x: -particle.size / 2, 
                      y: -particle.size / 2, 
                      scale: 0,
                      opacity: 0,
                      rotate: 0 
                    }}
                    animate={{ 
                      x: [
                        -particle.size / 2,
                        particle.x - particle.size / 2,
                        particle.x * 1.2 - particle.size / 2
                      ],
                      y: [
                        -particle.size / 2,
                        particle.y - particle.size / 2,
                        particle.y * 1.2 - particle.size / 2
                      ],
                      scale: [0, particle.scale, particle.scale * 1.1, 0],
                      opacity: [0, particle.opacity, particle.opacity * 0.8, 0],
                      rotate: [0, particle.rotation, particle.rotation + 180] 
                    }}
                    transition={{ 
                      duration: particle.duration * 1.2, 
                      ease: [0.25, 0.46, 0.45, 0.94],
                      delay: particle.delay,
                      repeat: Infinity,
                      repeatType: "loop",
                      times: [0, 0.3, 0.7, 1]
                    }}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
          
          {/* Enhanced sphere that emerges from flower */}
          <motion.div
            className="absolute rounded-full z-20 w-40 h-40"
            style={sphereGradient}
            initial={{ scale: 0, opacity: 0 }}
            animate={sphereControls}
          >
            {/* Enhanced animated inner gradients for depth */}
            <motion.div 
              className="absolute inset-0 rounded-full"
              animate={{
                rotate: 360,
                scale: [1, 1.02, 1],
              }}
              transition={{
                rotate: { duration: 25, repeat: Infinity, ease: "linear" },
                scale: { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div 
                className="absolute inset-0 rounded-full" 
                style={{ 
                  background: "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 70%)",
                  opacity: 0.8
                }} 
              />
            </motion.div>
            
            {/* Enhanced pulse effect with smoother transitions */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-white/20"
              initial={{ scale: 0.8, opacity: 0.3 }}
              animate={pulseControls}
              style={{ filter: "blur(2px)" }}
            />
            
            {/* Enhanced second pulse with offset timing */}
            <motion.div 
              className="absolute inset-0 rounded-full bg-white/10"
              initial={{ scale: 0.8, opacity: 0.2 }}
              animate={{
                scale: [0.6, 1.1, 0.6],
                opacity: [0.2, 0.5, 0.2],
                rotate: [0, 360]
              }}
              transition={{
                scale: { duration: 5, repeat: Infinity, ease: [0.37, 0, 0.63, 1] },
                opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                delay: 1.5
              }}
              style={{ filter: "blur(3px)" }}
            />
            
            {/* Additional inner glow for extra depth */}
            <motion.div 
              className="absolute inset-2 rounded-full"
              animate={{
                opacity: [0.3, 0.7, 0.3],
                scale: [0.9, 1.05, 0.9]
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{ 
                background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                filter: "blur(1px)"
              }}
            />
          </motion.div>
          
          {/* Enhanced Genie logo with smoother animations */}
          <motion.div
            className="absolute z-30"
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={logoControls}
          >
            <div className="flex flex-col items-center">
              {/* Enhanced mini sphere icon */}
              <motion.div 
                className="w-6 h-6 mb-3 rounded-full relative overflow-hidden" 
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 360]
                }}
                transition={{
                  scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                }}
                style={{ 
                  background: "linear-gradient(135deg, #e0f2ff 0%, #d8d6ff 45%, #f0d5ff 100%)",
                  boxShadow: "0 0 8px rgba(255,255,255,0.4)"
                }}
              >
                <div className="absolute inset-0 rounded-full bg-white/50" style={{ filter: "blur(1.5px)" }} />
                <motion.div 
                  className="absolute top-0 left-0 w-full h-full rounded-full"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  style={{ 
                    background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.3) 100%)",
                    opacity: 0.8
                  }} 
                />
              </motion.div>
              
              {/* Enhanced Genie text with breathing effect */}
              <motion.div 
                className="text-xl text-white/90 font-light tracking-wide"
                animate={{
                  opacity: [0.9, 1, 0.9],
                  scale: [1, 1.01, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: [0.37, 0, 0.63, 1]
                }}
                style={{
                  textShadow: "0 0 10px rgba(255,255,255,0.3)"
                }}
              >
                Genie
              </motion.div>
            </div>
          </motion.div>
          
          {/* Enhanced background gradient overlay */}
          <motion.div 
            className="absolute inset-0 z-25"
            initial={{ opacity: 0 }}
            animate={backgroundControls}
            style={{
              background: "linear-gradient(135deg, rgba(188,212,255,0.4) 0%, rgba(222,187,255,0.3) 50%, rgba(252,187,227,0.2) 100%)",
            }}
          >
            {/* Enhanced floating light particles with smoother movements */}
            {isMounted && floatingParticles.map((particle) => (
              <motion.div 
                key={particle.id}
                className="absolute rounded-full bg-white/40"
                style={{
                  width: particle.size,
                  height: particle.size,
                  filter: "blur(10px)",
                  boxShadow: "0 0 20px rgba(255,255,255,0.2)"
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
                    `${particle.endX}%`,
                    `${particle.initialX}%`
                  ],
                  y: [
                    `${particle.initialY}%`, 
                    `${particle.midY}%`, 
                    `${particle.endY}%`,
                    `${particle.initialY}%`
                  ],
                  opacity: [0, 0.5, 0.3, 0],
                  scale: [0.8, 1.3, 1.1, 0.8]
                }}
                transition={{
                  duration: particle.duration * 1.2,
                  delay: particle.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                  repeat: Infinity,
                  times: [0, 0.3, 0.7, 1]
                }}
              />
            ))}
          </motion.div>
          
          {/* Enhanced final white overlay for smoother transition to app */}
          <motion.div 
            className="absolute inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={overlayControls}
            style={{
              background: "radial-gradient(circle, rgba(255,255,255,0) 0%, rgba(255,255,255,0.7) 70%, rgba(255,255,255,1) 100%)"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}