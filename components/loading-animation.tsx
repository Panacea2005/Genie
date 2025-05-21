"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence, useAnimation } from "framer-motion"

export default function LoadingAnimation() {
  // Animation state management
  const [showAnimation, setShowAnimation] = useState(true)
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
  
  // Generate particles for flower pattern
  const particleCount = 30
  const particles = Array.from({ length: particleCount }).map((_, i) => ({
    id: i,
    scale: 0.2 + Math.random() * 0.8,
    x: Math.random() * 250 - 125,
    y: Math.random() * 250 - 125,
    rotation: Math.random() * 360,
    opacity: 0.3 + Math.random() * 0.7,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 1.5,
  }))

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

  // Main choreographed animation sequence
  useEffect(() => {
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
      
      // 2. Flower transforms into sphere - shrink flower as sphere grows
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
      
      // Background gradient fades in as sphere expands
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
      
      // 5. Fade to white to transition to app
      overlayControls.start({
        opacity: 1,
        transition: { duration: 1.8, ease: "easeInOut" }
      })
      
      // Final pause before completing
      await new Promise(resolve => {
        const timeout = setTimeout(resolve, 1500)
        timeoutsRef.current.push(timeout)
      })
      
      // Animation complete
      setShowAnimation(false)
    }
    
    // Start the animation sequence
    animationSequence()
    
    // Clean up timeouts and animation frames on unmount
    return () => {
      timeoutsRef.current.forEach(clearTimeout)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [flowerControls, sphereControls, backgroundControls, overlayControls, pulseControls, logoControls, particleControls])

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
  
  // Dynamic sphere gradient styles
  const sphereGradient = {
    background: `radial-gradient(circle, 
      ${interpolateColor("#c084fc", "#93c5fd", colorProgress)} 0%, 
      ${interpolateColor("#60a5fa", "#818cf8", colorProgress)} 50%, 
      ${interpolateColor("#93c5fd", "#c084fc", colorProgress)} 100%)`,
    filter: `blur(${4 + Math.sin(colorProgress * Math.PI * 4) * 2}px)`,
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
            
            {/* Particle effect around flower */}
            <motion.div
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={particleControls}
            >
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
            {/* Floating light particles */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                key={i}
                className="absolute rounded-full bg-white/40"
                style={{
                  width: 10 + Math.random() * 40,
                  height: 10 + Math.random() * 40,
                  filter: "blur(8px)"
                }}
                initial={{
                  x: `${Math.random() * 100}%`,
                  y: `${Math.random() * 100}%`,
                  opacity: 0,
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
                  opacity: [0, 0.4, 0],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 8 + Math.random() * 7,
                  delay: Math.random() * 2,
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