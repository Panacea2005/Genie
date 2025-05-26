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
  description: string
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
      description: 'Track and understand your feelings',
      icon: SmilePlus
    },
    {
      id: 'wellness',
      name: 'Wellness',
      description: 'Breathing and meditation exercises',
      icon: Heart
    },
    {
      id: 'resources',
      name: 'Resources',
      description: 'Mental health support and guides',
      icon: LifeBuoy
    },
    {
      id: 'tracker',
      name: 'Mood Tracker',
      description: 'Visualize your emotional journey',
      icon: BarChart2
    },
    {
      id: 'skills',
      name: 'Coping Skills',
      description: 'Techniques for stress management',
      icon: BookOpen
    },
    {
      id: 'safety',
      name: 'Safety Plan',
      description: 'Your personal wellness strategy',
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
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Navigation - Fixed at top */}
      <div className="relative z-50">
        <Navbar currentPage="dashboard" />
      </div>
      
      {/* Main Layout - Fixed height minus navbar */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="fixed top-20 left-4 z-40 p-2 bg-white/80 backdrop-blur-sm rounded-md border border-gray-200 md:hidden"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <aside
          className={`
            h-full bg-white/80 backdrop-blur-sm border-r border-gray-100 transition-all duration-300 z-30 flex-shrink-0
            ${sidebarCollapsed ? 'w-20' : 'w-64'}
            ${mobileMenuOpen ? 'fixed left-0' : 'fixed -left-64 md:relative md:left-0'}
          `}
          style={{
            boxShadow: "0 0 15px rgba(0, 0, 0, 0.05)"
          }}
        >
          {/* Sidebar Header */}
          <div className="p-4">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <h2 className="text-lg font-light text-gray-800">Wellness Space</h2>
              )}
              <button
                onClick={toggleSidebar}
                className="hidden md:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className={`w-4 h-4 text-gray-600 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="px-4 pb-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                    ${isActive 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'hover:bg-gray-50 text-gray-600'
                    }
                  `}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gray-900' : 'text-gray-600'}`} />
                  {!sidebarCollapsed && (
                    <>
                      <div className="text-left flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </>
                  )}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Mobile Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-20 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area - Scrollable */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {activeTab === 'emotions' && (
                  <motion.div
                    key="emotions"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <EmotionsTab />
                  </motion.div>
                )}
                
                {activeTab === 'wellness' && (
                  <motion.div
                    key="wellness"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <WellnessTab />
                  </motion.div>
                )}
                
                {activeTab === 'resources' && (
                  <motion.div
                    key="resources"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ResourcesTab />
                  </motion.div>
                )}
                
                {activeTab === 'tracker' && (
                  <motion.div
                    key="tracker"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TrackerTab />
                  </motion.div>
                )}
                
                {activeTab === 'skills' && (
                  <motion.div
                    key="skills"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SkillsTab />
                  </motion.div>
                )}
                
                {activeTab === 'safety' && (
                  <motion.div
                    key="safety"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
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