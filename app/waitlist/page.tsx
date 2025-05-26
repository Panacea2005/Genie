"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

export default function WaitlistPage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [email, setEmail] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [spherePulse, setSpherePulse] = useState(false)

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Here you would typically handle the form submission to your backend
    console.log("Email submitted:", email)
    setIsSubmitted(true)
    
    // Trigger sphere pulse animation on successful submission
    setSpherePulse(true)
    
    // Reset after animation completes
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail("")
      setSpherePulse(false)
    }, 2000)
  }

  // Prevent scrolling on this page
  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [])

  return (
    <main className="h-screen flex flex-col bg-white">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Header - Using the shared Navbar component */}
      <Navbar currentPage="waitlist" />

      {/* Main content with centered sphere and elements on it */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        <div className="flex flex-col items-center max-w-xl w-full">
          {/* Main content with animations */}
          <motion.div 
            className="flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* Mini gradient sphere icon - replacing gear icon */}
            <motion.div 
              className="mb-3 z-10 w-10 h-10 flex items-center justify-center"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-6 h-6 rounded-full relative" style={{ 
                background: "linear-gradient(135deg, #e0f2ff 0%, #d8d6ff 45%, #f0d5ff 100%)"
              }}>
                {/* Inner glow */}
                <div className="absolute inset-0 rounded-full bg-white/40" style={{ filter: "blur(1px)" }} />
                
                {/* Highlight reflection */}
                <div 
                  className="absolute top-0 left-0 w-full h-full rounded-full" 
                  style={{ 
                    background: "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.2) 100%)",
                    opacity: 0.5
                  }} 
                />
              </div>
            </motion.div>
            
            {/* Refined small label text */}
            <motion.div
              className="text-xs uppercase tracking-wider text-gray-400 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Early Access
            </motion.div>
            
            {/* Main text with large Genie logo using the same font as home page */}
            <motion.h1 
              className="text-6xl md:text-7xl font-light mb-6 text-gray-800 z-10 logo-text"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Genie
            </motion.h1>
            
            {/* Sphere container with absolute positioned text and email input */}
            <div className="relative flex flex-col items-center justify-center w-full mb-4">
              {/* 3D Gradient Sphere with pulse on submission - made smaller */}
              <motion.div
                className="scale-75 md:scale-90"
                animate={spherePulse ? {
                  scale: [0.75, 0.78, 0.75],
                  transition: { duration: 1.2, ease: "easeInOut" }
                } : {}}
              >
                <GradientSphere />
              </motion.div>
              
              <div className="absolute flex flex-col items-center max-w-md w-full z-20" style={{ top: "45%" }}>
                {/* Text above email input with refined typography */}
                <motion.p
                  className="text-center text-gray-600 mb-6 font-light text-sm leading-relaxed px-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  Join our Early Access program to experience Genie first.<br/>
                  We'll notify you when you're invited.
                </motion.p>
                
                {/* Refined email input positioned on the sphere */}
                <motion.form 
                  className="flex w-full gap-3 px-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onSubmit={handleSubmit}
                >
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`flex-1 h-11 px-5 rounded-full border ${isFocused ? 'border-gray-300' : 'border-gray-200'} 
                      bg-white/90 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-0 
                      focus:border-gray-300 text-sm text-gray-600 font-light transition-all duration-300`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    required
                  />
                  <motion.button
                    type="submit"
                    className="h-11 w-11 rounded-full bg-black text-white flex items-center justify-center shadow-sm"
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitted ? (
                        <motion.svg 
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className="w-4 h-4" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </motion.svg>
                      ) : (
                        <motion.svg 
                          key="arrow"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </motion.svg>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.form>
                
                {/* Success message that appears when submitted */}
                <AnimatePresence>
                  {isSubmitted && (
                    <motion.div
                      className="absolute top-full mt-4 text-center"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-sm text-gray-500 font-light">
                        Thank you! We'll be in touch soon.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer - Now visible at bottom */}
      <Footer />
    </main>
  )
}