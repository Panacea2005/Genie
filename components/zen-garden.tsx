"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

interface ColorTheme {
  center: string;
  mid1: string;
  mid2: string;
  edge: string;
}

interface ZenGardenProps {
  colors?: ColorTheme;
  intensity?: 'calm' | 'serene' | 'deep';
  category?: 'mindfulness' | 'sleep' | 'anxiety' | 'focus' | 'healing' | 'gratitude' | 'relationships' | 'creativity';
}

interface Rock {
  x: number;
  y: number;
  width: number;
  height: number;
  dots: Array<{ x: number; y: number; size: number }>;
}

interface SandDot {
  x: number;
  y: number;
  size: number;
  opacity: number;
  layer: number;
}

export default function ZenGarden({ 
  colors, 
  intensity = 'serene',
  category = 'mindfulness'
}: ZenGardenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  const animationRef = useRef<{
    rock: Rock | null;
    sandDots: SandDot[];
  }>({
    rock: null,
    sandDots: [],
  })

  // Default zen colors - extract RGB values for dot rendering
  const defaultColors: ColorTheme = {
    center: 'rgba(100, 100, 100, 0.8)', // Dark gray for rock
    mid1: 'rgba(150, 150, 150, 0.6)',   // Medium gray for sand
    mid2: 'rgba(180, 180, 180, 0.4)',   // Light gray for sand
    edge: 'rgba(200, 200, 200, 0.3)',   // Very light gray for outer sand
  }

  const currentColors = colors || defaultColors;

  // Extract RGB values from rgba strings
  const extractRGB = (rgbaString: string) => {
    const match = rgbaString.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),?\s*([\d.]*)\)/)
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: parseFloat(match[4] || '1')
      }
    }
    return { r: 100, g: 100, b: 100, a: 0.8 }
  }

  // Intensity configurations - static version
  const intensityConfig = {
    calm: { sandDensity: 0.4 },
    serene: { sandDensity: 0.5 },
    deep: { sandDensity: 0.6 }
  }

  const config = intensityConfig[intensity]

  // Pattern configurations for different meditation categories
  const getPatternConfig = (category: string) => {
    switch (category) {
      case 'mindfulness':
        return {
          pattern: 'concentric',
          rings: 12,
          spacing: 25,
          flowDirection: 'circular'
        }
      case 'sleep':
        return {
          pattern: 'spiral',
          rings: 8,
          spacing: 35,
          flowDirection: 'inward'
        }
      case 'anxiety':
        return {
          pattern: 'waves',
          rings: 10,
          spacing: 20,
          flowDirection: 'horizontal'
        }
      case 'focus':
        return {
          pattern: 'rays',
          rings: 16,
          spacing: 15,
          flowDirection: 'radial'
        }
      case 'healing':
        return {
          pattern: 'petals',
          rings: 8,
          spacing: 30,
          flowDirection: 'organic'
        }
      case 'gratitude':
        return {
          pattern: 'heart',
          rings: 10,
          spacing: 25,
          flowDirection: 'heart'
        }
      case 'relationships':
        return {
          pattern: 'infinity',
          rings: 12,
          spacing: 20,
          flowDirection: 'figure8'
        }
      case 'creativity':
        return {
          pattern: 'mandala',
          rings: 15,
          spacing: 18,
          flowDirection: 'artistic'
        }
      default:
        return {
          pattern: 'concentric',
          rings: 12,
          spacing: 25,
          flowDirection: 'circular'
        }
    }
  }

  // Generate one large central rock
  const generateRock = (width: number, height: number) => {
    const rockWidth = Math.min(width, height) * 0.25
    const rockHeight = rockWidth * 0.6
    const x = width / 2
    const y = height / 2
    
    const dots: Array<{ x: number; y: number; size: number }> = []
    
    // Create elliptical rock shape with dots
    const dotsInRock = Math.floor((rockWidth * rockHeight) / 40)
    for (let j = 0; j < dotsInRock; j++) {
      const angle = Math.random() * Math.PI * 2
      const radiusX = (Math.random() * rockWidth) / 2
      const radiusY = (Math.random() * rockHeight) / 2
      
      // Create elliptical distribution
      const dotX = Math.cos(angle) * radiusX * (0.3 + Math.random() * 0.7)
      const dotY = Math.sin(angle) * radiusY * (0.3 + Math.random() * 0.7)
      
      dots.push({
        x: dotX,
        y: dotY,
        size: 3 + Math.random() * 4
      })
    }
    
    animationRef.current.rock = { x, y, width: rockWidth, height: rockHeight, dots }
  }

  // Generate sand pattern based on category
  const generateSandPattern = (width: number, height: number) => {
    if (!animationRef.current.rock) return
    
    const sandDots: SandDot[] = []
    const rock = animationRef.current.rock
    const patternConfig = getPatternConfig(category)
    const totalDots = Math.floor((width * height) * config.sandDensity / 8000)
    
         // Generate pattern-specific sand dots
     for (let ring = 0; ring < patternConfig.rings; ring++) {
       const baseRadius = Math.max(rock.width, rock.height) / 2 + 40 + (ring * patternConfig.spacing)
       const dotsInRing = Math.floor(baseRadius * 0.3)
      
      for (let i = 0; i < dotsInRing; i++) {
        const angle = (i / dotsInRing) * Math.PI * 2
        let x = rock.x
        let y = rock.y
        
        // Apply pattern-specific positioning
        switch (patternConfig.pattern) {
          case 'concentric':
            x += Math.cos(angle) * baseRadius
            y += Math.sin(angle) * baseRadius * 0.8
            break
            
          case 'spiral':
            const spiralAngle = angle + ring * 0.5
            x += Math.cos(spiralAngle) * baseRadius
            y += Math.sin(spiralAngle) * baseRadius * 0.8
            break
            
          case 'waves':
            const waveOffset = Math.sin(angle * 3) * 20
            x += Math.cos(angle) * (baseRadius + waveOffset)
            y += Math.sin(angle) * (baseRadius * 0.6 + waveOffset * 0.5)
            break
            
          case 'rays':
            const rayAngle = Math.floor(angle / (Math.PI / 8)) * (Math.PI / 8)
            x += Math.cos(rayAngle) * baseRadius
            y += Math.sin(rayAngle) * baseRadius * 0.8
            break
            
          case 'petals':
            const petalAngle = angle + Math.sin(angle * 6) * 0.3
            x += Math.cos(petalAngle) * baseRadius
            y += Math.sin(petalAngle) * baseRadius * 0.8
            break
            
          case 'heart':
            const heartX = 16 * Math.sin(angle) ** 3
            const heartY = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)
            x += heartX * (baseRadius / 100)
            y += heartY * (baseRadius / 100) * 0.8
            break
            
          case 'infinity':
            const figureX = Math.cos(angle) / (1 + Math.sin(angle) ** 2)
            const figureY = Math.sin(angle) * Math.cos(angle) / (1 + Math.sin(angle) ** 2)
            x += figureX * baseRadius
            y += figureY * baseRadius * 0.8
            break
            
          case 'mandala':
            const mandalaAngle = angle + Math.sin(angle * 8) * 0.2
            const mandalaRadius = baseRadius * (0.8 + 0.2 * Math.sin(angle * 12))
            x += Math.cos(mandalaAngle) * mandalaRadius
            y += Math.sin(mandalaAngle) * mandalaRadius * 0.8
            break
        }
        
                 // Only add if within canvas bounds
         if (x >= 0 && x <= width && y >= 0 && y <= height) {
           sandDots.push({
             x,
             y,
             size: 1.5 + Math.random() * 2,
             opacity: (1 - ring / patternConfig.rings) * 0.7 + 0.2,
             layer: ring
           })
         }
      }
    }
    
    animationRef.current.sandDots = sandDots
  }

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Static drawing function
    const drawStaticGarden = () => {
      if (!ctx || !canvas.width || !canvas.height) return

      const { width, height } = canvas

      // Clear canvas with transparent background
      ctx.clearRect(0, 0, width, height)

      // Draw static sand dots
      const sandColor1 = extractRGB(currentColors.mid1)
      const sandColor2 = extractRGB(currentColors.mid2)
      const sandColor3 = extractRGB(currentColors.edge)
      
      animationRef.current.sandDots.forEach(dot => {
        // Choose color based on layer (distance from rock)
        let color = sandColor1
        if (dot.layer > 4) color = sandColor2
        if (dot.layer > 8) color = sandColor3
        
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${dot.opacity})`
        ctx.beginPath()
        ctx.arc(dot.x, dot.y, dot.size, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw static rock
      if (animationRef.current.rock) {
        const rockColor = extractRGB(currentColors.center)
        const rock = animationRef.current.rock
        
        rock.dots.forEach(dot => {
          const x = rock.x + dot.x
          const y = rock.y + dot.y
          
          ctx.fillStyle = `rgba(${rockColor.r}, ${rockColor.g}, ${rockColor.b}, ${rockColor.a})`
          ctx.beginPath()
          ctx.arc(x, y, dot.size, 0, Math.PI * 2)
          ctx.fill()
        })
      }
    }

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      
      if (canvas.width > 0 && canvas.height > 0) {
        generateRock(canvas.width, canvas.height)
        generateSandPattern(canvas.width, canvas.height)
        drawStaticGarden()
        setIsVisible(true)
      }
    }
    
    setCanvasDimensions()
    window.addEventListener('resize', setCanvasDimensions)

        // Redraw when colors change
    drawStaticGarden()

    return () => {
      window.removeEventListener('resize', setCanvasDimensions)
    }
  }, [currentColors, intensity, category, config])

  return (
    <motion.div 
      className="relative w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? 1 : 0 }}
      transition={{ duration: 2 }}
    >
      <canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Subtle overlay for depth */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${currentColors.edge.replace(/[\d.]+\)$/, '0.03)')} 0%, transparent 70%)`
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
} 