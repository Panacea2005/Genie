"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import GradientSphere from "@/components/gradient-sphere"
import { useAuth } from "@/app/contexts/AuthContext"

export default function AuthPage() {
  // Form state
  const [isSignIn, setIsSignIn] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  
  const { signIn, signUp, signInWithGoogle, signInWithGithub } = useAuth()
  const router = useRouter()
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    
    try {
      if (isSignIn) {
        // Handle sign in
        const { error } = await signIn(email, password)
        if (error) {
          throw error
        }
        
        setIsSubmitted(true)
        
        // Redirect to home page after successful login
        setTimeout(() => {
          router.push("/")
        }, 1500)
      } else {
        // Handle sign up
        const { error } = await signUp(email, password, name)
        if (error) {
          throw error
        }
        
        setIsSubmitted(true)
        
        // Show success message and switch to sign in
        setTimeout(() => {
          setIsSubmitted(false)
          setIsSignIn(true)
          setEmail("")
          setPassword("")
          setName("")
        }, 1500)
      }
    } catch (error: any) {
      setErrorMessage(error.message || "An error occurred during authentication")
      setIsLoading(false)
    }
  }

  // Handle social login
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setErrorMessage("")
    try {
      if (provider === 'google') {
        const { error } = await signInWithGoogle()
        if (error) throw error
      } else {
        const { error } = await signInWithGithub()
        if (error) throw error
      }
    } catch (error: any) {
      setErrorMessage(error.message || `Error signing in with ${provider}`)
    }
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
                  onClick={() => {
                    setIsSignIn(!isSignIn)
                    setErrorMessage("")
                  }}
                >
                  {isSignIn ? "Sign Up" : "Sign In"}
                </button>
              </div>
            </motion.div>
            
            {/* Flex spacer to push form to bottom */}
            <div className="flex-grow"></div>
            
            {/* Form container positioned at bottom */}
            <div className="mb-8">
              {/* Error message */}
              {errorMessage && (
                <motion.div 
                  className="mb-4 p-4 bg-red-50 border border-red-100 rounded-md text-sm text-red-600"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errorMessage}
                </motion.div>
              )}
              
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
            
            {/* Social login buttons - Google and GitHub */}
            <div className="flex gap-4 mb-6">
              <motion.button
                onClick={() => handleSocialLogin('google')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded border border-gray-300 bg-white/80 hover:bg-white transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                  <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
                  <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
                  <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
                </svg>
                <span className="text-xs text-gray-800">GOOGLE</span>
              </motion.button>
              
              <motion.button
                onClick={() => handleSocialLogin('github')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded border border-gray-300 bg-white/80 hover:bg-white transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.475 2 2 6.475 2 12C2 16.425 4.8625 20.1625 8.8375 21.4875C9.3375 21.575 9.525 21.275 9.525 21.0125C9.525 20.775 9.5125 19.9875 9.5125 19.15C7 19.6125 6.35 18.5375 6.15 17.975C6.0375 17.6875 5.55 16.8 5.125 16.5625C4.775 16.375 4.275 15.9125 5.1125 15.9C5.9 15.8875 6.4625 16.625 6.65 16.925C7.55 18.4375 8.9875 18.0125 9.5625 17.75C9.65 17.1 9.9125 16.6625 10.2 16.4125C7.975 16.1625 5.65 15.3 5.65 11.475C5.65 10.3875 6.0375 9.4875 6.675 8.7875C6.575 8.5375 6.225 7.5125 6.775 6.1375C6.775 6.1375 7.6125 5.875 9.525 7.1625C10.325 6.9375 11.175 6.825 12.025 6.825C12.875 6.825 13.725 6.9375 14.525 7.1625C16.4375 5.8625 17.275 6.1375 17.275 6.1375C17.825 7.5125 17.475 8.5375 17.375 8.7875C18.0125 9.4875 18.4 10.375 18.4 11.475C18.4 15.3125 16.0625 16.1625 13.8375 16.4125C14.2 16.725 14.5125 17.325 14.5125 18.2625C14.5125 19.6 14.5 20.675 14.5 21.0125C14.5 21.275 14.6875 21.5875 15.1875 21.4875C19.1375 20.1625 22 16.4125 22 12C22 6.475 17.525 2 12 2Z" fill="#161614"/>
                </svg>
                <span className="text-xs text-gray-800">GITHUB</span>
              </motion.button>
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