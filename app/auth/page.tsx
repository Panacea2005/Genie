"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import GradientSphere from "@/components/gradient-sphere"

export default function AuthPage() {
  // Form state
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSubmitted(true)
      
      // Reset form after success
      setTimeout(() => {
        setIsSubmitted(false)
      }, 1500)
    }, 1000)
  }

  return (
    <main className="relative w-full h-screen overflow-hidden flex">
      {/* Full screen background with gradient sphere */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-full h-full flex items-center justify-center">
          <GradientSphere />
        </div>
      </div>
      
      {/* Logo in the corner - EXACT same as navbar */}
      <Link href="/" className="absolute top-6 left-6 z-30">
        <motion.div 
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Logo - same as navbar */}
          <span className="text-xl font-light tracking-wide text-gray-800">
            Genie
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
      </Link>
      
      {/* Right side auth panel with light theme grainy effect */}
      <div className="absolute right-0 top-0 bottom-0 w-[45%] min-w-[500px] z-20">
        {/* Light panel with grainy texture */}
        <motion.div 
          className="h-full w-full bg-white/70 flex flex-col border-l border-white/40"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
        >
          {/* Grainy texture overlay */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              backgroundSize: '150px 150px'
            }}
          />
          
          {/* Content container with adjusted layout */}
          <div className="relative z-10 flex flex-col h-full px-16 pt-16 pb-8">
            {/* Welcome text at the top */}
            <motion.div 
              className="mb-16"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <h1 className="text-gray-800 text-4xl font-light mb-2">
                {isSignIn ? "Welcome Back!" : "Join Genie"}
              </h1>
              
              <div className="flex items-center text-sm text-gray-600 font-light">
                <span>{isSignIn ? "Don't have an account?" : "Already have an account?"}</span>
                <button 
                  className="ml-2 text-indigo-600 hover:text-indigo-800 transition-colors"
                  onClick={() => setIsSignIn(!isSignIn)}
                >
                  {isSignIn ? "Sign Up" : "Sign In"}
                </button>
              </div>
            </motion.div>
            
            {/* Flex spacer to push form to bottom */}
            <div className="flex-grow"></div>
            
            {/* Form container positioned at bottom */}
            <div className="mb-8">
              <AnimatePresence mode="wait">
                <motion.form 
                  key={isSignIn ? "signin" : "signup"}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  onSubmit={handleSubmit}
                >
                  {/* Name field for signup only */}
                  {!isSignIn && (
                    <motion.div 
                      className="space-y-1"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <label className="block text-xs text-gray-600 font-light">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-transparent border-b border-gray-300 px-0 py-3 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                        placeholder="Your name"
                        required
                      />
                    </motion.div>
                  )}
                  
                  {/* Email field with underline style like in reference */}
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600 font-light">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 px-0 py-3 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  
                  {/* Password field with underline style */}
                  <div className="space-y-1">
                    <label className="block text-xs text-gray-600 font-light">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-transparent border-b border-gray-300 px-0 py-3 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  {/* Submit button - dark with uppercase text */}
                  <motion.button
                    type="submit"
                    className="w-full rounded px-4 py-3 mt-8 text-xs uppercase tracking-widest text-white bg-black hover:bg-gray-800 relative overflow-hidden transition-colors"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isLoading || isSubmitted}
                  >
                    {/* Button text */}
                    <div className="relative z-10 flex items-center justify-center">
                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
                          />
                        ) : isSubmitted ? (
                          <motion.svg 
                            key="check"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="w-5 h-5" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </motion.svg>
                        ) : (
                          <motion.span 
                            key="button-text"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            {isSignIn ? "CONTINUE WITH EMAIL" : "CREATE ACCOUNT"}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </motion.form>
              </AnimatePresence>
            </div>
            
            {/* Divider with "or" text */}
            <div className="flex items-center my-6">
              <div className="h-px bg-gray-300 flex-grow" />
              <span className="px-4 text-xs text-gray-500 uppercase tracking-widest">or</span>
              <div className="h-px bg-gray-300 flex-grow" />
            </div>
            
            {/* Terms of service text */}
            <div className="text-xs text-gray-500 font-light leading-relaxed">
              By signing up for a Genie account, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                Privacy Policy
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-800 transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}