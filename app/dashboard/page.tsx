"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/contexts/AuthContext"
import {
  Heart,
  Brain,
  Shield,
  BarChart2,
  BookOpen,
  LifeBuoy,
  SmilePlus,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Sparkles
} from "lucide-react"

import Navbar from "@/components/navbar"
import GradientSphere from "@/components/gradient-sphere"

// Import tab components
import EmotionsTab from "@/components/dashboard/emotions-tab"
import WellnessTab from "@/components/dashboard/wellness-tab"
import ResourcesTab from "@/components/dashboard/resources-tab"
import TrackerTab from "@/components/dashboard/tracker-tab"
import SafetyTab from "@/components/dashboard/safety-tab"

type TabType = 'emotions' | 'wellness' | 'resources' | 'tracker' | 'safety'

interface SidebarItem {
  id: TabType
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  colorTheme: string[]
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // State management
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('emotions')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Enhanced sidebar configuration with color themes
  const sidebarItems: SidebarItem[] = [
    {
      id: 'emotions',
      name: 'Emotions',
      description: 'Track and understand your feelings',
      icon: SmilePlus,
      colorTheme: ['#C7D2FE', '#E0E7FF', '#A5B4FC']
    },
    {
      id: 'wellness',
      name: 'Wellness',
      description: 'Breathing and meditation exercises',
      icon: Heart,
      colorTheme: ['#FECACA', '#FEE2E2', '#FCA5A5']
    },
    {
      id: 'resources',
      name: 'Resources',
      description: 'Mental health support and guides',
      icon: LifeBuoy,
      colorTheme: ['#BFDBFE', '#DBEAFE', '#93C5FD']
    },
    {
      id: 'tracker',
      name: 'Mood Tracker',
      description: 'Visualize your emotional journey',
      icon: BarChart2,
      colorTheme: ['#DDD6FE', '#EDE9FE', '#C4B5FD']
    },
    {
      id: 'safety',
      name: 'Safety Plan',
      description: 'Your personal wellness strategy',
      icon: Shield,
      colorTheme: ['#BBF7D0', '#D1FAE5', '#86EFAC']
    }
  ]

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  // Initialize component
  useEffect(() => {
    if (!user) return
    setMounted(true)
    
    // Load sidebar preference
    const savedSidebarState = localStorage.getItem('dashboardSidebarCollapsed')
    if (savedSidebarState !== null) {
      setSidebarCollapsed(savedSidebarState === 'true')
    }
  }, [user])

  // Save sidebar state
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('dashboardSidebarCollapsed', newState.toString())
  }

  // Handle tab change
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId)
    setMobileMenuOpen(false)
  }

  const currentItem = sidebarItems.find(item => item.id === activeTab)

  if (!mounted || loading) return null

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Ambient particles effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, -20, 20],
              x: [null, -10, 10],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
      
      {/* Navigation - Fixed at top */}
      <div className="relative z-50">
        <Navbar currentPage="dashboard" />
      </div>
      
      {/* Main Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-20 left-4 z-40 p-2 bg-white/30 backdrop-blur-sm rounded-md border border-white/20 md:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Minimal Sidebar */}
        <aside
          className={`
            h-full backdrop-blur-sm border-r border-white/20 transition-all duration-500 z-30 flex-shrink-0
            ${sidebarCollapsed ? 'w-20' : 'w-64'}
            ${mobileMenuOpen ? 'fixed left-0 bg-white/40' : 'fixed -left-64 md:relative md:left-0 bg-transparent'}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-6">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <motion.h2 
                  className="text-base font-light text-gray-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  Wellness Space
                </motion.h2>
              )}
              <button
                onClick={toggleSidebar}
                className="hidden md:flex p-1.5 hover:bg-white/20 rounded-lg transition-all"
              >
                <ChevronLeft className={`w-4 h-4 text-gray-600 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Items - Minimal Style */}
          <nav className="px-4 pb-4">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`
                    w-full flex items-center gap-4 px-3 py-3 mb-2 rounded-xl transition-all duration-300 group relative
                    ${isActive 
                      ? 'text-gray-800' 
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 8 }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  {/* Active indicator dot */}
                  <motion.div
                    className={`absolute left-0 w-1 h-8 rounded-r-full transition-all duration-300 ${
                      isActive ? 'bg-gray-800' : 'bg-transparent'
                    }`}
                    animate={{
                      opacity: isActive ? [0.5, 1, 0.5] : 0,
                    }}
                    transition={{
                      duration: 2,
                      repeat: isActive ? Infinity : 0,
                      ease: "easeInOut"
                    }}
                  />
                  
                  <Icon className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? 'text-gray-800' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  
                  {!sidebarCollapsed && (
                    <motion.div 
                      className="text-left flex-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className={`text-sm font-medium transition-all duration-300 ${
                        isActive ? 'translate-x-2' : ''
                      }`}>
                        {item.name}
                      </div>
                    </motion.div>
                  )}
                </motion.button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-20 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden">
          {/* Content */}
          <div className="relative z-10 h-full overflow-y-auto">
            <div className="p-8 lg:p-12 max-w-7xl mx-auto">
              {/* Page Header */}
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    className="p-2 rounded-full bg-white/30 backdrop-blur-sm border border-white/20"
                    whileHover={{ scale: 1.05 }}
                  >
                    {currentItem && <currentItem.icon className="w-5 h-5 text-gray-700" />}
                  </motion.div>
                  <h1 className="text-4xl font-light text-gray-800">
                    {currentItem?.name}
                  </h1>
                </div>
                <p className="text-gray-600 font-light">
                  {currentItem?.description}
                </p>
              </motion.div>

              {/* Tab Content with smooth transitions */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="relative"
                >
                  {activeTab === 'emotions' && <EmotionsTab />}
                  {activeTab === 'wellness' && <WellnessTab />}
                  {activeTab === 'resources' && <ResourcesTab />}
                  {activeTab === 'tracker' && <TrackerTab />}
                  {activeTab === 'safety' && <SafetyTab />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}