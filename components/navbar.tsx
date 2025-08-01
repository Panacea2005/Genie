"use client"

import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/app/contexts/AuthContext"
import { useProfile } from "@/hooks/use-profile"

// Custom button component 
const NavButton = ({ 
  children, 
  href, 
  variant = "default",
  onClick,
  ...props 
}: { 
  children: React.ReactNode
  href?: string
  variant?: "default" | "outline" | "ghost"
  onClick?: () => void
  [key: string]: any
}) => {
  const baseClass = "rounded-full px-4 py-1.5 text-sm font-medium flex items-center gap-1.5 transition-all duration-300"
  
  const variants = {
    default: "bg-black text-white hover:bg-gray-800",
    outline: "border border-gray-300 hover:border-gray-400 hover:bg-gray-50",
    ghost: "hover:bg-gray-100"
  }
  
  if (onClick) {
    return (
      <motion.button 
        className={`${baseClass} ${variants[variant]} cursor-pointer`}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.button>
    )
  }
  
  return (
    <Link href={href || "/"} passHref>
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

// User avatar component with dropdown menu
const UserAvatar = ({ user, onSignOut }: { user: any, onSignOut: () => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  
  // Use the custom hook to fetch complete profile
  const { name: profileName, avatarUrl, loading: loadingProfile } = useProfile(user?.id)
  
  // Use profile name if available, fallback to auth metadata, then email
  const displayName = profileName || user?.user_metadata?.name || user?.email?.split('@')[0] || "User"
  const initial = displayName.charAt(0).toUpperCase()
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsOpen(false)
    }
    
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])
  
  return (
    <div className="relative">
      <motion.div 
        className="flex items-center gap-2 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        whileHover={{ scale: 1.05 }}
      >
        <span className="text-xs text-gray-500 font-light hidden sm:inline">
          {loadingProfile ? "Loading..." : displayName}
        </span>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile avatar"
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
            onError={(e) => {
              // If avatar fails to load, hide it and show the fallback
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}
        <div 
          className={`w-8 h-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-gray-800 text-sm ${avatarUrl ? 'hidden' : ''}`}
        >
          {initial}
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-800">
                {loadingProfile ? "Loading profile..." : displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="p-2">
              <Link href="/profile" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors w-full text-left">
                Profile
              </Link>
              <Link href="/settings" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors w-full text-left">
                Settings
              </Link>
              <button 
                className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors text-left"
                onClick={(e) => {
                  e.stopPropagation()
                  onSignOut()
                  setIsOpen(false)
                }}
              >
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Navbar({ currentPage = "home" }: { currentPage?: string }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, loading, signOut } = useAuth()

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
        {/* Conditional Waitlist/Home button */}
        {currentPage === "waitlist" ? (
          <NavButton href="/" variant="outline" className="text-xs font-light flex items-center">
            <span className="mr-1">↑</span> Home
          </NavButton>
        ) : (
          <NavButton href="/waitlist" variant="outline" className="text-xs font-light flex items-center">
            <span className="mr-1">→</span> Waitlist
          </NavButton>
        )}
        
        {/* Chat button - second */}
        <NavButton href="/chat" variant="ghost" className="text-xs text-gray-500 font-light">
          Chat
        </NavButton>

        {/* Dashboard button - third */}
        <NavButton href="/dashboard" variant="ghost" className="text-xs text-gray-500 font-light">
          Dashboard
        </NavButton>

        {/* Model Test button - fourth */}
        <NavButton href="/model-test" variant="ghost" className="text-xs text-gray-500 font-light">
          Model Test
        </NavButton>

        {/* Meditation button - fifth */}
        <NavButton href="/meditation" variant="ghost" className="text-xs text-gray-500 font-light">
          Meditation
        </NavButton>

        {loading ? (
          // Loading state
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        ) : user ? (
          // User is signed in - show user avatar
          <UserAvatar user={user} onSignOut={signOut} />
        ) : (
          // User is not signed in - show auth button last
          <NavButton href="/auth" variant="ghost" className="text-xs text-gray-500 font-light">
            Sign Up / Login
          </NavButton>
        )}
      </div>
    </motion.header>
  )
}