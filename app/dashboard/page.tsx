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
  ChevronLeft,
  Menu,
  X
} from "lucide-react"

import Navbar from "@/components/navbar"

// Import tab components
import EmotionsTab from "@/components/dashboard/emotions-tab"
import WellnessTab from "@/components/dashboard/wellness-tab"
import ResourcesTab from "@/components/dashboard/resources-tab"
import TrackerTab from "@/components/dashboard/tracker-tab"
import SkillsTab from "@/components/dashboard/skills-tab"
import SafetyTab from "@/components/dashboard/safety-tab"

type TabType = 'emotions' | 'wellness' | 'resources' | 'tracker' | 'skills' | 'safety'

interface SidebarItem {
  id: TabType
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // State management
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('emotions')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Sidebar configuration
  const sidebarItems: SidebarItem[] = [
    {
      id: 'emotions',
      name: 'Emotions',
      icon: SmilePlus
    },
    {
      id: 'wellness',
      name: 'Wellness',
      icon: Heart
    },
    {
      id: 'resources',
      name: 'Resources',
      icon: LifeBuoy
    },
    {
      id: 'tracker',
      name: 'Tracker',
      icon: BarChart2
    },
    {
      id: 'skills',
      name: 'Skills',
      icon: BookOpen
    },
    {
      id: 'safety',
      name: 'Safety',
      icon: Shield
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

  if (!mounted || loading) return null

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 -z-10" />
      
      {/* Navigation */}
      <Navbar currentPage="dashboard" />
      
      {/* Main Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-20 left-4 z-40 p-2 bg-white/50 backdrop-blur-sm rounded-full border border-gray-200/50 md:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
        </button>

        {/* Minimal Collapsible Sidebar */}
        <aside
          className={`
            h-full bg-white/50 backdrop-blur-sm border-r border-gray-100/50 transition-all duration-300 z-30 flex-shrink-0
            ${sidebarCollapsed ? 'w-16' : 'w-56'}
            ${mobileMenuOpen ? 'fixed left-0' : 'fixed -left-56 md:relative md:left-0'}
          `}
        >
          {/* Sidebar Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100/50">
            {!sidebarCollapsed && (
              <motion.h2 
                className="text-sm font-light text-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                Wellness
              </motion.h2>
            )}
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-1.5 hover:bg-gray-100/50 rounded-lg transition-colors"
            >
              <ChevronLeft className={`w-4 h-4 text-gray-500 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            {sidebarItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group
                    ${isActive 
                      ? 'bg-gray-100/70 text-gray-800' 
                      : 'hover:bg-gray-50/50 text-gray-600'
                    }
                  `}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 2 }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-gray-700' : 'text-gray-500'}`} />
                  {!sidebarCollapsed && (
                    <motion.span 
                      className="text-sm font-light"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                  
                  {/* Active indicator dot */}
                  {isActive && sidebarCollapsed && (
                    <motion.div
                      className="absolute right-2 w-1.5 h-1.5 bg-gray-700 rounded-full"
                      layoutId="activeIndicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-20 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="px-8 py-12 lg:px-12">
              <AnimatePresence mode="wait">
                {activeTab === 'emotions' && (
                  <motion.div
                    key="emotions"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <EmotionsTab />
                  </motion.div>
                )}
                
                {activeTab === 'wellness' && (
                  <motion.div
                    key="wellness"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <WellnessTab />
                  </motion.div>
                )}
                
                {activeTab === 'resources' && (
                  <motion.div
                    key="resources"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <ResourcesTab />
                  </motion.div>
                )}
                
                {activeTab === 'tracker' && (
                  <motion.div
                    key="tracker"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <TrackerTab />
                  </motion.div>
                )}
                
                {activeTab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <SkillsTab />
                  </motion.div>
                )}
                
                {activeTab === 'safety' && (
                  <motion.div
                    key="safety"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <SafetyTab />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}