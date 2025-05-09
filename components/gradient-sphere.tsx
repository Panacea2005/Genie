"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

export default function GradientSphere() {
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