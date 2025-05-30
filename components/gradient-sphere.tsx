"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface ColorTheme {
  center: string;
  mid1: string;
  mid2: string;
  edge: string;
}

interface GradientSphereProps {
  colors?: ColorTheme;
}

export default function GradientSphere({ colors }: GradientSphereProps) {
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

  // Default colors if none provided
  const defaultColors: ColorTheme = {
    center: 'rgba(190, 205, 255, 0.95)', // Light blue center
    mid1: 'rgba(180, 190, 255, 0.9)',    // Light lavender
    mid2: 'rgba(200, 180, 255, 0.8)',    // Light purple
    edge: 'rgba(220, 175, 230, 0.6)',    // Light pink/purple
  }

  const currentColors = colors || defaultColors;

  // Animation effect with enhanced "living" behavior
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions with a larger size
    const setCanvasDimensions = () => {
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
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const distX = (x - centerX) / centerX
      const distY = (y - centerY) / centerY
      
      sphereRef.current.speed = 0.005 + Math.abs(distX * distY) * 0.003
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    
    // Add occasional "breathing" effect
    const breathingInterval = setInterval(() => {
      sphereRef.current.speed = 0.005 + Math.random() * 0.01
      
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
      
      // Create gradient with custom colors
      const angle = sphereRef.current.rotation
      const currentTime = Date.now() / 1000
      
      // Organic movement for gradient center
      const pulseSize = Math.sin(currentTime * 0.8) * 0.05 + 0.1
      const gradientX = centerX + Math.sin(angle * 0.7) * radius * pulseSize
      const gradientY = centerY + Math.cos(angle * 0.5) * radius * pulseSize
      
      const gradient = ctx.createRadialGradient(
        gradientX, gradientY, radius * 0.2,
        centerX, centerY, radius
      )
      
      // Apply the color theme
      gradient.addColorStop(0, currentColors.center)
      gradient.addColorStop(0.4, currentColors.mid1)
      gradient.addColorStop(0.7, currentColors.mid2)
      gradient.addColorStop(0.85, currentColors.edge)
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      // Draw main sphere
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
      
      // Enhanced highlight
      const now = Date.now() / 1000
      
      // Primary highlight - white glow
      const highlightRadius = radius * 0.7
      const organicMovement = Math.sin(now * 0.4) * radius * 0.05
      const highlightX = centerX - radius * 0.1 + Math.sin(angle * 0.8) * radius * 0.08 + organicMovement
      const highlightY = centerY - radius * 0.1 + Math.cos(angle * 0.7) * radius * 0.1 - organicMovement
      
      const highlightGradient = ctx.createRadialGradient(
        highlightX, highlightY, 0,
        highlightX, highlightY, highlightRadius
      )
      
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)')
      highlightGradient.addColorStop(0.4, 'rgba(240, 250, 255, 0.4)')
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      
      ctx.beginPath()
      ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2)
      ctx.fillStyle = highlightGradient
      ctx.fill()
      
      // Edge highlight - using the edge color
      const edgeHighlightRadius = radius * 0.6
      const edgeHighlightX = centerX + radius * 0.4 + Math.cos(now * 0.7) * radius * 0.05
      const edgeHighlightY = centerY - radius * 0.3 + Math.sin(now * 0.9) * radius * 0.05
      
      const edgeHighlightGradient = ctx.createRadialGradient(
        edgeHighlightX, edgeHighlightY, edgeHighlightRadius * 0.5,
        edgeHighlightX, edgeHighlightY, edgeHighlightRadius
      )
      
      // Extract RGB values from edge color for dynamic highlight
      const edgeColorWithAlpha = currentColors.edge.replace(/[\d.]+\)$/, '0.3)');
      
      edgeHighlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)')
      edgeHighlightGradient.addColorStop(0.7, edgeColorWithAlpha)
      edgeHighlightGradient.addColorStop(1, currentColors.edge)
      
      ctx.beginPath()
      ctx.arc(edgeHighlightX, edgeHighlightY, edgeHighlightRadius, 0, Math.PI * 2)
      ctx.fillStyle = edgeHighlightGradient
      ctx.fill()
      
      // Internal layers
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
  }, [currentColors]) // Re-run effect when colors change

  // Extract main color from center for the glow
  const glowColor = currentColors.center.replace(/[\d.]+\)$/, '0.4)');

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
      
      {/* Dynamic background glow based on color theme */}
      <motion.div 
        className="absolute inset-0 rounded-full opacity-40 blur-3xl -z-10"
        style={{
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}