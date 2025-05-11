"use client"

import { useEffect, useState, useRef, SetStateAction } from "react"
import { motion, AnimatePresence, useAnimationControls } from "framer-motion"
import LoadingAnimation from "@/components/loading-animation"
import SearchBar from "@/components/search-bar"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

// Define prompts and content for each section - now with intro section
const sections = [
  {
    id: 'intro',
    prompt: 'Hi, how can I help you today?',
    title: 'Meet Genie, your AI companion.',
    iconText: '✧',
    labelText: 'Genie',
    cardTitle: 'Genie AI',
    cardSubtitle: 'Your Personal AI',
    cardDescription: 'Genie is designed to understand you on a deeper level. From celebrating your joys to providing comfort during difficult times, Genie is here to support your journey.',
    cardLabel: 'Welcome',
    imageUrl: '/images/genie.jpg',
    accentColor: 'rgba(147, 112, 219, 0.7)' // Light purple
  },
  {
    id: 'joy',
    prompt: 'I just got promoted! What should I do to celebrate?',
    title: 'Genie understands your moments of joy.',
    iconText: '✿',
    labelText: 'Joy',
    cardTitle: 'Celebration Ideas',
    cardSubtitle: 'Achievement, Recognition, Reward',
    cardDescription: 'Congratulations on your promotion! Consider treating yourself to a special dinner, planning a weekend getaway to recharge, or sharing the moment with loved ones who\'ve supported your journey.',
    cardLabel: 'Genie Celebrates',
    imageUrl: '/images/joy.jpg',
    accentColor: 'rgba(255, 126, 95, 0.7)' // Warm orange
  },
  {
    id: 'growth',
    prompt: 'How can I become more confident in social settings?',
    title: 'Genie understands your desire for growth.',
    iconText: '★',
    labelText: 'Growth',
    cardTitle: 'Building Social Confidence',
    cardSubtitle: 'Practice, Presence, Progress',
    cardDescription: 'Start with small social interactions in comfortable environments. Remember that listening is as valuable as speaking. Celebrate each positive interaction, and know that confidence develops gradually through consistent practice.',
    cardLabel: 'Genie Guidance',
    imageUrl: '/images/growth.jpg',
    accentColor: 'rgba(72, 187, 120, 0.7)' // Teal green
  },
  {
    id: 'challenge',
    prompt: 'I\'m feeling overwhelmed with all my responsibilities',
    title: 'Genie understands your daily challenges.',
    iconText: '❋',
    labelText: 'Challenge',
    cardTitle: 'Managing Overwhelm',
    cardSubtitle: 'Prioritize, Breathe, Structure',
    cardDescription: 'It\'s normal to feel overwhelmed when juggling multiple responsibilities. Try breaking down tasks into smaller steps, focusing on one thing at a time, and remembering that asking for help is a sign of strength, not weakness.',
    cardLabel: 'Genie Support',
    imageUrl: '/images/challenge.jpg',
    accentColor: 'rgba(66, 153, 225, 0.7)' // Blue
  },
  {
    id: 'comfort',
    prompt: 'I\'m feeling really down today and don\'t know why',
    title: 'Genie comforts you.',
    iconText: '◎',
    labelText: 'Comfort',
    cardTitle: 'Gentle Self-Care',
    cardSubtitle: 'Acknowledge, Accept, Nurture',
    cardDescription: 'Some days are harder than others, even without a clear reason. Be gentle with yourself today. Simple comforts like a favorite movie, warm tea, or a quiet walk can help. Remember that feelings, both good and difficult, are temporary.',
    cardLabel: 'Genie Cares',
    imageUrl: '/images/comfort.jpg',
    accentColor: 'rgba(159, 122, 234, 0.7)' // Lavender
  }
]

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState(0)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [wheelTimeout, setWheelTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isCardChanging, setIsCardChanging] = useState(false)
  
  // Animation controls for smooth transitions
  const sphereControls = useAnimationControls()
  const expandedCardRef = useRef(null)
  
  // Set up smooth loading transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)
    
    return () => clearTimeout(timer)
  }, [])
  
  // Handle wheel events for section navigation
  useEffect(() => {
    // Handle wheel event in main view
    const handleWheel = (e: { preventDefault: () => void; deltaY: number }) => {
      e.preventDefault() // Prevent actual scrolling
      
      // If we're in expanded card view, handle differently
      if (expandedCard) {
        handleExpandedCardWheel(e)
        return
      }
      
      // Debounce wheel events to prevent rapid section changes
      if (wheelTimeout) {
        clearTimeout(wheelTimeout)
      }
      
      const newTimeout = setTimeout(() => {
        if (e.deltaY > 0 && activeSection < sections.length - 1) {
          // Prepare sphere animation for section change
          sphereControls.start({
            scale: [1, 0.95, 1],
            transition: { duration: 0.5 }
          })
          
          // Scrolling down
          setActiveSection(prev => prev + 1)
        } else if (e.deltaY < 0 && activeSection > 0) {
          // Prepare sphere animation for section change
          sphereControls.start({
            scale: [1, 0.95, 1],
            transition: { duration: 0.5 }
          })
          
          // Scrolling up
          setActiveSection(prev => prev - 1)
        }
      }, 300)
      
      setWheelTimeout(newTimeout)
    }
    
    // Handle wheel event in expanded card view
    const handleExpandedCardWheel = (e: { preventDefault?: () => void; deltaY: any }) => {
      // Prevent rapid changes
      if (isCardChanging) return
      
      // Debounce wheel events to prevent rapid section changes
      if (wheelTimeout) {
        clearTimeout(wheelTimeout)
      }
      
      const newTimeout = setTimeout(() => {
        // Find current section index
        const currentIndex = sections.findIndex(s => s.id === expandedCard)
        
        if (e.deltaY > 0 && currentIndex < sections.length - 1) {
          // Scrolling down - change to next card
          setIsCardChanging(true)
          
          // Animate transition to next card
          setTimeout(() => {
            setExpandedCard(sections[currentIndex + 1].id)
            setIsCardChanging(false)
          }, 300)
        } else if (e.deltaY < 0 && currentIndex > 0) {
          // Scrolling up - change to previous card
          setIsCardChanging(true)
          
          // Animate transition to previous card
          setTimeout(() => {
            setExpandedCard(sections[currentIndex - 1].id)
            setIsCardChanging(false)
          }, 300)
        }
      }, 300)
      
      setWheelTimeout(newTimeout)
    }
    
    // Add and clean up wheel event listener
    window.addEventListener('wheel', handleWheel, { passive: false })
    
    return () => {
      if (wheelTimeout) clearTimeout(wheelTimeout)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [activeSection, wheelTimeout, expandedCard, isCardChanging, sphereControls])
  
  // Handle key events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: { key: string }) => {
      if (expandedCard) {
        // Handle expanded card view navigation
        if (e.key === 'Escape') {
          handleCardClose()
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          // Find current section index
          const currentIndex = sections.findIndex(s => s.id === expandedCard)
          if (currentIndex < sections.length - 1) {
            setExpandedCard(sections[currentIndex + 1].id)
          }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          // Find current section index
          const currentIndex = sections.findIndex(s => s.id === expandedCard)
          if (currentIndex > 0) {
            setExpandedCard(sections[currentIndex - 1].id)
          }
        }
      } else {
        // Handle main view navigation
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
          if (activeSection < sections.length - 1) {
            setActiveSection(prev => prev + 1)
          }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
          if (activeSection > 0) {
            setActiveSection(prev => prev - 1)
          }
        } else if (e.key === 'Enter') {
          handleCardExpand(sections[activeSection].id)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeSection, expandedCard])
  
  const handleCardExpand = (sectionId: SetStateAction<string | null>) => {
    setExpandedCard(sectionId)
  }
  
  const handleCardClose = () => {
    setExpandedCard(null)
  }

  if (loading) {
    return <LoadingAnimation />
  }

  return (
    <main className="h-screen overflow-hidden flex flex-col bg-white relative">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Navbar component */}
      <Navbar currentPage="home" />

      {/* Main content - full screen */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center max-w-2xl w-full px-4">
          <AnimatePresence mode="wait">
            {/* Logo and label */}
            <motion.div
              key={`icon-${activeSection}`}
              className="mb-3 p-2 rounded-full bg-white/80 border border-gray-100 shadow-sm z-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 20,
                mass: 0.8
              }}
            >
              <motion.div 
                className="w-5 h-5 flex items-center justify-center text-base text-gray-700"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                {sections[activeSection].iconText}
              </motion.div>
            </motion.div>
            
            <motion.div 
              key={`label-${activeSection}`}
              className="text-xs font-light text-gray-500 mb-4 tracking-wide z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {sections[activeSection].labelText}
            </motion.div>
  
            {/* Main title - ENHANCED: Larger typography for section title */}
            <motion.h2 
              key={`title-${activeSection}`}
              className="text-3xl md:text-4xl font-light text-center mb-8 text-gray-800 z-10"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ 
                duration: 0.4,
                ease: [0.23, 1, 0.32, 1] // Cubic bezier for smooth easing
              }}
            >
              {sections[activeSection].title}
            </motion.h2>
          </AnimatePresence>
          
          {/* Sphere and search bar */}
          <div className="relative flex flex-col items-center justify-center my-4 w-full">
            {/* 3D Gradient Sphere with enhanced animations */}
            <motion.div animate={sphereControls}>
              <GradientSphere />
            </motion.div>
            
            {/* Search bar positioned on top of the sphere - now shown for ALL sections including intro */}
            <motion.div 
              className="absolute w-full max-w-md z-20" 
              style={{ top: "calc(50% - 24px)" }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <SearchBar 
                prompt={sections[activeSection].prompt}
                onExpand={() => handleCardExpand(sections[activeSection].id)}
              />
            </motion.div>
            
            {/* Help text below search bar for Intro section only */}
            {activeSection === 0 && (
              <motion.div
                className="absolute w-full max-w-md z-20 text-center"
                style={{ top: "calc(50% + 30px)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.4 }}
              >
                <p className="text-xs text-gray-400 font-light mt-2">
                  Scroll to see more examples
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Progress indicator on right side - vertical bars - HIDE WHEN CARD EXPANDED */}
      <AnimatePresence>
        {!expandedCard && (
          <motion.div 
            className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-4 z-30"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {sections.map((section, index) => (
              <motion.div
                key={section.id}
                className="relative flex items-center cursor-pointer"
                onClick={() => setActiveSection(index)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div 
                  className={`${activeSection === index ? 'h-6 bg-gray-400' : 'h-1.5 bg-gray-200'} 
                    w-1.5 rounded-full transition-all duration-300`}
                  animate={{
                    height: activeSection === index ? 24 : 6
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 22,
                    mass: 0.8
                  }}
                />
                
                {/* Show label on hover */}
                <AnimatePresence>
                  {activeSection === index && (
                    <motion.div
                      className="absolute right-4 bg-white/90 px-2 py-1 rounded-md shadow-sm text-xs text-gray-600 whitespace-nowrap"
                      style={{ right: "100%", marginRight: "12px" }}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2 }}
                    >
                      {section.labelText}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced expanded card view with elegant styling */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div 
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              ref={expandedCardRef}
              className="relative w-[85vw] h-[85vh] bg-cover bg-center rounded-3xl overflow-hidden"
              style={{ 
                backgroundImage: `url(${sections.find(s => s.id === expandedCard)?.imageUrl || '/images/default.jpg'})` 
              }}
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ 
                type: "spring", 
                damping: 30,
                stiffness: 300,
                mass: 0.8
              }}
            >
              {/* Subtle gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
              
              {/* Close button with elegant animation */}
              <motion.div 
                className="absolute top-4 right-4 z-50"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.button 
                  className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center border border-white/20"
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.4)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCardClose}
                >
                  <span className="text-white text-lg">×</span>
                </motion.button>
              </motion.div>
              
              {/* Animated card with enhanced styling */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 w-3/4 max-w-xl">
                <motion.div 
                  className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-8 overflow-hidden"
                  style={{
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {/* Subtle accent color line at top of card */}
                  <div 
                    className="absolute top-0 left-0 right-0 h-1 rounded-t"
                    style={{ 
                      background: sections.find(s => s.id === expandedCard)?.accentColor || 'rgba(147, 112, 219, 0.7)'
                    }}
                  />
                  
                  <div className="text-xs text-white/80 uppercase mb-1 tracking-wider">Portal</div>
                  
                  {/* ENHANCED: Larger typography for title */}
                  <h2 className="text-5xl font-light text-white mb-4 tracking-tight">
                    {sections.find(s => s.id === expandedCard)?.cardTitle}
                  </h2>
                  
                  <div className="text-sm text-white/90 mb-6 tracking-wide">
                    {sections.find(s => s.id === expandedCard)?.cardSubtitle}
                  </div>
                  
                  <p className="text-white/85 text-sm leading-relaxed mb-8 font-light">
                    {sections.find(s => s.id === expandedCard)?.cardDescription}
                  </p>
                  
                  <div className="flex items-center mt-2">
                    <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center mr-2 overflow-hidden">
                      <span className="text-white text-xs">{sections.find(s => s.id === expandedCard)?.iconText || '⚙'}</span>
                    </div>
                    <span className="text-white/90 text-sm font-light tracking-wide">
                      {sections.find(s => s.id === expandedCard)?.cardLabel}
                    </span>
                  </div>
                </motion.div>
              </div>
              
              {/* Enhanced position indicator */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {sections.map((section, index) => (
                  <motion.div 
                    key={index}
                    className={`rounded-full cursor-pointer ${
                      section.id === expandedCard 
                        ? "bg-white w-6 h-1.5" 
                        : "bg-white/40 w-1.5 h-1.5"
                    }`}
                    animate={{
                      width: section.id === expandedCard ? 24 : 6,
                    }}
                    whileHover={{ 
                      backgroundColor: section.id === expandedCard 
                        ? "rgba(255, 255, 255, 1)" 
                        : "rgba(255, 255, 255, 0.6)" 
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedCard(section.id)
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  />
                ))}
              </div>
              
              {/* ENHANCED: Improved previous/next navigation with better hover effects */}
              <div className="absolute bottom-20 left-0 right-0 flex justify-between px-12 text-white/50 text-sm">
                {expandedCard !== sections[0].id && (
                  <motion.div 
                    className="flex items-center cursor-pointer group px-4 py-2 rounded-full"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    whileHover={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === expandedCard)
                      if (currentIndex > 0) {
                        setExpandedCard(sections[currentIndex - 1].id)
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transform group-hover:-translate-x-1 transition-transform duration-300">
                      <path d="M19 12H5M12 19l-7-7 7-7"/>
                    </svg>
                    <span className="text-sm font-light group-hover:text-white transition-colors duration-300">Previous</span>
                  </motion.div>
                )}
                
                {expandedCard !== sections[sections.length-1].id && (
                  <motion.div 
                    className="flex items-center ml-auto cursor-pointer group px-4 py-2 rounded-full"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.3 }}
                    whileHover={{ 
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      transition: { duration: 0.2 }
                    }}
                    onClick={() => {
                      const currentIndex = sections.findIndex(s => s.id === expandedCard)
                      if (currentIndex < sections.length - 1) {
                        setExpandedCard(sections[currentIndex + 1].id)
                      }
                    }}
                  >
                    <span className="text-sm font-light group-hover:text-white transition-colors duration-300">Next</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 transform group-hover:translate-x-1 transition-transform duration-300">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer stays at bottom */}
      <Footer />
    </main>
  )
}