"use client"

import { useEffect, useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion } from "framer-motion"
import LoadingAnimation from "@/components/loading-animation"
import SearchBar from "@/components/search-bar"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

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
      
      {/* Header - Now using the Navbar component */}
      <Navbar currentPage="home" />

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
              {/* 3D Gradient Sphere - Now using the GradientSphere component */}
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

      {/* Footer - Now using the Footer component */}
      <Footer />
    </main>
  )
}