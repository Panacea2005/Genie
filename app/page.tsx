"use client"

import { useEffect, useState, useRef } from "react"
import { X, Instagram, Music, ChevronDown, Settings, Menu } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import LoadingAnimation from "@/components/loading-animation"
import SearchBar from "@/components/search-bar"

// 3D Sphere Component
const GradientSphere = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sphereRef = useRef<{
    rotation: number;
    speed: number;
    animate: boolean;
  }>({
    rotation: 0,
    speed: 0.005,
    animate: true,
  })

  // Animation effect with enhanced "living" behavior
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions with a larger size
    const setCanvasDimensions = () => {
      // Make the sphere larger to accommodate the search bar on top
      const size = Math.min(window.innerWidth * 0.9, 700)
      canvas.width = size
      canvas.height = size
    }
    
    setCanvasDimensions()
    window.addEventListener('resize', setCanvasDimensions)
    
    // Add interaction - sphere reacts to mouse movement
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return
      
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Calculate distance from center
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const distX = (x - centerX) / centerX // -1 to 1
      const distY = (y - centerY) / centerY // -1 to 1
      
      // Adjust speed based on mouse position - creates "living" response
      sphereRef.current.speed = 0.005 + Math.abs(distX * distY) * 0.003
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    // Add occasional "breathing" effect for more organic feeling
    const breathingInterval = setInterval(() => {
      sphereRef.current.speed = 0.005 + Math.random() * 0.01
      
      // After a short while, return to normal speed
      setTimeout(() => {
        sphereRef.current.speed = 0.005
      }, 800)
    }, 5000)

    // Draw gradient sphere
    const drawSphere = () => {
      if (!ctx || !canvas) return
      
      const { width, height } = canvas
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 2.5
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height)
      
      // Create gradient with subtle rainbow colors like the reference image
      const angle = sphereRef.current.rotation
      const currentTime = Date.now() / 1000
      
      // More organic movement for gradient center
      const pulseSize = Math.sin(currentTime * 0.8) * 0.05 + 0.1
      const gradientX = centerX + Math.sin(angle * 0.7) * radius * pulseSize
      const gradientY = centerY + Math.cos(angle * 0.5) * radius * pulseSize
      
      const gradient = ctx.createRadialGradient(
        gradientX, gradientY, radius * 0.2,  // Inner circle
        centerX, centerY, radius             // Outer circle
      )
      
      // Light rainbow gradient similar to the reference image
      // Blue/purple center transitioning to pink/purple edges
      gradient.addColorStop(0, 'rgba(190, 205, 255, 0.95)') // Light blue center
      gradient.addColorStop(0.4, 'rgba(180, 190, 255, 0.9)') // Light lavender
      gradient.addColorStop(0.7, 'rgba(200, 180, 255, 0.8)') // Light purple
      gradient.addColorStop(0.85, 'rgba(220, 175, 230, 0.6)') // Light pink/purple
      gradient.addColorStop(1, 'rgba(180, 160, 220, 0)')      // Transparent edge
      
      // Draw main sphere
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Enhanced "living" highlight that matches the reference image
      const now = Date.now() / 1000
      
      // Primary highlight - creates the blue/white inner glow
      const highlightRadius = radius * 0.7
      const organicMovement = Math.sin(now * 0.4) * radius * 0.05
      const highlightX = centerX - radius * 0.1 + Math.sin(angle * 0.8) * radius * 0.08 + organicMovement
      const highlightY = centerY - radius * 0.1 + Math.cos(angle * 0.7) * radius * 0.1 - organicMovement
      
      const highlightGradient = ctx.createRadialGradient(
        highlightX, highlightY, 0,
        highlightX, highlightY, highlightRadius
      )
      
      // Bright center highlight transitioning to transparent
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
      highlightGradient.addColorStop(0.4, 'rgba(240, 250, 255, 0.4)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.beginPath()
      ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()
      
      // Pink edge highlight - creates the pinkish glow at edges
      const edgeHighlightRadius = radius * 0.6
      const edgeHighlightX = centerX + radius * 0.4 + Math.cos(now * 0.7) * radius * 0.05
      const edgeHighlightY = centerY - radius * 0.3 + Math.sin(now * 0.9) * radius * 0.05
      
      const edgeHighlightGradient = ctx.createRadialGradient(
        edgeHighlightX, edgeHighlightY, edgeHighlightRadius * 0.5,
        edgeHighlightX, edgeHighlightY, edgeHighlightRadius
      )
      
      edgeHighlightGradient.addColorStop(0, 'rgba(255, 200, 255, 0)')
      edgeHighlightGradient.addColorStop(0.7, 'rgba(230, 190, 240, 0.2)')
      edgeHighlightGradient.addColorStop(1, 'rgba(210, 180, 240, 0.4)')
      
      ctx.beginPath()
      ctx.arc(edgeHighlightX, edgeHighlightY, edgeHighlightRadius, 0, Math.PI * 2)
      ctx.fillStyle = edgeHighlightGradient
      ctx.fill()
      
      // Add internal "living" movement instead of orbit particles
      const innerLayerCount = 3
      for (let i = 0; i < innerLayerCount; i++) {
        const layerRadius = radius * (0.3 + i * 0.2)
        const wobble = Math.sin(now * (1.5 - i * 0.3) + i * Math.PI / 2) * radius * 0.1
        
        const innerX = centerX + Math.sin(angle * (0.5 + i * 0.3)) * wobble
        const innerY = centerY + Math.cos(angle * (0.7 + i * 0.4)) * wobble
        
        const innerGradient = ctx.createRadialGradient(
          innerX, innerY, 0,
          innerX, innerY, layerRadius
        )
        
        // More subtle, whiter colors
        innerGradient.addColorStop(0, `rgba(255, 255, 255, ${0.5 - i * 0.15})`)
        innerGradient.addColorStop(0.7, `rgba(240, 245, 255, ${0.2 - i * 0.05})`)
        innerGradient.addColorStop(1, 'rgba(240, 245, 255, 0)')
        
        ctx.beginPath()
        ctx.arc(innerX, innerY, layerRadius, 0, Math.PI * 2)
        ctx.fillStyle = innerGradient
        ctx.fill()
      }
      
      // Update rotation
      if (sphereRef.current.animate) {
        sphereRef.current.rotation += sphereRef.current.speed
      }
      
      requestAnimationFrame(drawSphere)
    }
    
    drawSphere()
    
    return () => {
      window.removeEventListener('resize', setCanvasDimensions)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(breathingInterval)
    }
  }, [])

  return (
    <motion.div 
      className="relative z-10"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -8, 0],
      }}
      transition={{ 
        duration: 2,
        y: {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }}
    >
      <canvas 
        ref={canvasRef} 
        className="max-w-full h-auto"
        style={{ filter: "blur(8px)", maxWidth: "90%" }}
      />
      
      {/* Subtle background glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 opacity-40 blur-3xl -z-10" />
    </motion.div>
  )
}

// Custom button component
const Button = ({ children, variant = "default", icon, ...props }: { 
  children: React.ReactNode, 
  variant?: "default" | "outline" | "ghost",
  icon?: React.ReactNode
  [key: string]: any
}) => {
  const baseClass = "rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-all duration-300"
  
  const variants = {
    default: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 hover:border-gray-400 hover:bg-gray-50",
    ghost: "hover:bg-gray-100"
  }
  
  return (
    <motion.button 
      className={`${baseClass} ${variants[variant]}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  )
}

// Prompt suggestions component
const PromptSuggestions = () => {
  const suggestions = [
    "Show me photos from last summer",
    "Find my trip to Japan",
    "When was the last time I met with Sarah?",
    "Show me my graduation photos"
  ]
  
  return (
    <div className="w-full max-w-md grid grid-cols-2 gap-3 my-10">
      {suggestions.map((suggestion, index) => (
        <motion.div
          key={index}
          className="border border-gray-200 rounded-xl p-3 cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 * index }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <p className="text-sm text-gray-800">{suggestion}</p>
        </motion.div>
      ))}
    </div>
  )
}

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [scrollIndicator, setScrollIndicator] = useState(0)

  useEffect(() => {
    // Longer loading time for the full animation sequence
    const timer = setTimeout(() => {
      setLoading(false)
    }, 10000) // 10 seconds for the full animation sequence

    const handleScroll = () => {
      const position = window.scrollY
      const height = document.body.scrollHeight - window.innerHeight
      const scrollPercentage = Math.min(position / height, 1)
      setScrollIndicator(scrollPercentage)
    }

    window.addEventListener('scroll', handleScroll)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  if (loading) {
    return <LoadingAnimation />
  }

  return (
    <main className="min-h-screen flex flex-col bg-white">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Header - More minimal and elegant */}
      <motion.header 
        className="flex justify-between items-center px-6 py-4 backdrop-blur-sm bg-white/60 sticky top-0 z-50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2">
          <motion.div 
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {/* Minimal and elegant logo */}
            <span className="text-xl font-light tracking-wide text-gray-800">
              genie
            </span>
            <motion.div 
              className="absolute -top-1 -right-2 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400"
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="text-xs text-gray-500 font-light">
            Settings
          </Button>
          <Button variant="outline" className="text-xs font-light">
            Waitlist <span className="ml-1">→</span>
          </Button>
        </div>
      </motion.header>

      {/* Main content with centered sphere and search bar on top */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="flex flex-col items-center max-w-2xl w-full">
          {/* Main content with animations */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Memories icon with animation */}
            <motion.div 
              className="mb-3 p-2 rounded-full bg-white/80 border border-gray-100 shadow-sm z-10"
              whileHover={{ scale: 1.1 }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <motion.div 
                className="w-5 h-5 flex items-center justify-center text-base text-gray-700"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                ✿
              </motion.div>
            </motion.div>
            
            <motion.div 
              className="text-xs font-light text-gray-500 mb-4 tracking-wide z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              MEMORIES
            </motion.div>

            {/* Main text with subtle styling */}
            <motion.h2 
              className="text-2xl font-light text-center mb-8 text-gray-800 z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Genie understands your past memories
            </motion.h2>
            
            {/* Sphere container with absolute positioned search bar */}
            <div className="relative flex flex-col items-center justify-center my-4 w-full">
              {/* 3D Gradient Sphere */}
              <GradientSphere />
              
              {/* Search bar positioned on top of the sphere */}
              <motion.div 
                className="absolute w-full max-w-md z-20"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                style={{ top: "calc(50% - 24px)" }}
              >
                <SearchBar />
              </motion.div>
            </div>
            
            {/* Enhanced scroll indicator - more subtle */}
            <motion.div 
              className="mt-16 mb-3 flex flex-col items-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div 
                className="w-0.5 h-10 rounded-full bg-gray-100 relative overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 1 }}
              >
                <motion.div 
                  className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-400 to-purple-400 rounded-full"
                  style={{ height: `${scrollIndicator * 100}%` }}
                />
              </motion.div>
              
              <motion.div 
                className="mt-2 flex flex-col items-center"
                animate={{ y: [0, 3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <ChevronDown className="w-3 h-3 text-gray-300" />
                <p className="text-xs text-gray-300 mt-1 font-light">scroll</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Footer - More minimal */}
      <motion.footer 
        className="p-5 flex justify-between items-center border-t border-gray-50 bg-white/60 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        <div className="flex gap-5">
          <motion.a 
            href="#" 
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="opacity-50 hover:opacity-80 transition-opacity"
          >
            <X className="w-3 h-3 text-gray-600" />
          </motion.a>
          <motion.a 
            href="#" 
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="opacity-50 hover:opacity-80 transition-opacity"
          >
            <Instagram className="w-3 h-3 text-gray-600" />
          </motion.a>
          <motion.a 
            href="#" 
            whileHover={{ scale: 1.1, y: -1 }}
            whileTap={{ scale: 0.9 }}
            className="opacity-50 hover:opacity-80 transition-opacity"
          >
            <Music className="w-3 h-3 text-gray-600" />
          </motion.a>
        </div>
        <motion.a 
          href="#" 
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors font-light"
          whileHover={{ scale: 1.05 }}
        >
          Privacy Policy
        </motion.a>
      </motion.footer>
    </main>
  )
}