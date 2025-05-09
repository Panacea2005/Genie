"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"

// Custom button component 
const NavButton = ({ 
  children, 
  href, 
  variant = "default",
  ...props 
}: { 
  children: React.ReactNode
  href: string
  variant?: "default" | "outline" | "ghost"
  [key: string]: any
}) => {
  const baseClass = "rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-all duration-300"
  
  const variants = {
    default: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 hover:border-gray-400 hover:bg-gray-50",
    ghost: "hover:bg-gray-100"
  }
  
  return (
    <Link href={href} passHref>
      <motion.div 
        className={`${baseClass} ${variants[variant]} cursor-pointer`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        {...props}
      >
        {children}
      </motion.div>
    </Link>
  )
}

export default function Navbar({ currentPage = "home" }: { currentPage?: string }) {
  const [isScrolled, setIsScrolled] = useState(false)

  // Add scroll detection in useEffect to prevent errors
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    // Add event listener inside useEffect
    window.addEventListener("scroll", handleScroll)
    
    // Initial check
    handleScroll()
    
    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <motion.header 
      className={`flex justify-between items-center px-6 py-4 sticky top-0 z-50 ${
        isScrolled ? "bg-white/80 backdrop-blur-sm" : ""
      }`}
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
          {/* Logo */}
          <Link href="/" className="text-xl font-light tracking-wide text-gray-800">
            Genie
          </Link>
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
        {/* Chat button - added before auth */}
        <NavButton href="/chat" variant="ghost" className="text-xs text-gray-500 font-light">
          Chat
        </NavButton>

        <NavButton href="/auth" variant="ghost" className="text-xs text-gray-500 font-light">
          Sign Up / Login
        </NavButton>
        
        {currentPage === "home" ? (
          <NavButton href="/waitlist" variant="outline" className="text-xs font-light flex items-center">
            Waitlist <span className="ml-1">→</span>
          </NavButton>
        ) : (
          <NavButton href="/" variant="outline" className="text-xs font-light flex items-center">
            Home <span className="ml-1">↑</span>
          </NavButton>
        )}
      </div>
    </motion.header>
  )
}