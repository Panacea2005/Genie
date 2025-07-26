"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/app/contexts/AuthContext"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

type SettingsTab = "account" | "meditation" | "wellness" | "notifications" | "privacy"

export default function SettingsPage() {
  const { user, loading, signOut, updatePassword, updateEmail } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>("account")
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Account settings states
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Meditation preferences
  const [meditationVoice, setMeditationVoice] = useState("female")
  const [speechRate, setSpeechRate] = useState(1.0)
  const [backgroundMusic, setBackgroundMusic] = useState(true)
  const [autoPlay, setAutoPlay] = useState(false)
  
  // Wellness settings
  const [dailyCheckIn, setDailyCheckIn] = useState(true)
  const [moodReminders, setMoodReminders] = useState(true)
  const [exerciseReminders, setExerciseReminders] = useState(true)
  const [safetyPlanAccess, setSafetyPlanAccess] = useState("private")
  
  // Notification settings
  const [meditationReminders, setMeditationReminders] = useState(true)
  const [wellnessCheckIns, setWellnessCheckIns] = useState(true)
  const [chatNotifications, setChatNotifications] = useState(true)
  const [emergencyAlerts, setEmergencyAlerts] = useState(true)
  
  // Privacy settings
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [dataRetention, setDataRetention] = useState("1year")
  const [shareProgress, setShareProgress] = useState(false)

  useEffect(() => {
    // Load user preferences from localStorage or API
    const savedPreferences = localStorage.getItem('genie-settings')
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences)
      setMeditationVoice(prefs.meditationVoice || "female")
      setSpeechRate(prefs.speechRate || 1.0)
      setBackgroundMusic(prefs.backgroundMusic !== false)
      setAutoPlay(prefs.autoPlay || false)
      setDailyCheckIn(prefs.dailyCheckIn !== false)
      setMoodReminders(prefs.moodReminders !== false)
      setExerciseReminders(prefs.exerciseReminders !== false)
      setSafetyPlanAccess(prefs.safetyPlanAccess || "private")
      setMeditationReminders(prefs.meditationReminders !== false)
      setWellnessCheckIns(prefs.wellnessCheckIns !== false)
      setChatNotifications(prefs.chatNotifications !== false)
      setEmergencyAlerts(prefs.emergencyAlerts !== false)
      setAnonymousMode(prefs.anonymousMode || false)
      setDataRetention(prefs.dataRetention || "1year")
      setShareProgress(prefs.shareProgress || false)
    }
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      // Handle email change if provided
      if (email && email !== user?.email) {
        const { error } = await updateEmail(email)
        if (error) {
          setSuccessMessage(`Email update failed: ${error.message}`)
          setIsSaving(false)
          setTimeout(() => setSuccessMessage(""), 3000)
          return
        } else {
          setSuccessMessage("Email update sent! Check your new email for verification link.")
          setIsSaving(false)
          setTimeout(() => setSuccessMessage(""), 5000)
          return
        }
      }
      
      // Handle password change if provided
      if (newPassword && confirmPassword) {
        if (newPassword !== confirmPassword) {
          setSuccessMessage("Passwords do not match")
          setIsSaving(false)
          setTimeout(() => setSuccessMessage(""), 3000)
          return
        }
        
        if (newPassword.length < 6) {
          setSuccessMessage("Password must be at least 6 characters")
          setIsSaving(false)
          setTimeout(() => setSuccessMessage(""), 3000)
          return
        }
        
        const { error } = await updatePassword(newPassword)
        if (error) {
          setSuccessMessage(`Password update failed: ${error.message}`)
          setIsSaving(false)
          setTimeout(() => setSuccessMessage(""), 3000)
          return
        }
        
        // Clear password fields after successful change
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setSuccessMessage("Password updated successfully!")
        setIsSaving(false)
        setTimeout(() => setSuccessMessage(""), 3000)
        return
      }
      
      // Save preferences to localStorage
      const preferences = {
        meditationVoice,
        speechRate,
        backgroundMusic,
        autoPlay,
        dailyCheckIn,
        moodReminders,
        exerciseReminders,
        safetyPlanAccess,
        meditationReminders,
        wellnessCheckIns,
        chatNotifications,
        emergencyAlerts,
        anonymousMode,
        dataRetention,
        shareProgress
      }
      
      localStorage.setItem('genie-settings', JSON.stringify(preferences))
      
      setIsSaving(false)
      setSuccessMessage("Settings saved successfully")
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
      
    } catch (error: any) {
      setIsSaving(false)
      setSuccessMessage(`Error: ${error.message}`)
      setTimeout(() => setSuccessMessage(""), 3000)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-600">Please sign in to view your settings.</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Navbar */}
      <Navbar currentPage="settings" />
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div className="relative w-full max-w-4xl">
          {/* Background sphere positioned to the right */}
          <div className="absolute -right-32 -bottom-32 opacity-50 pointer-events-none">
            <GradientSphere />
          </div>
          
          <motion.div 
            className="relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 max-h-[calc(100vh-160px)]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-xl md:text-2xl font-light text-gray-800 mb-4">Settings</h1>
            
            {/* Success message */}
            {successMessage && (
              <motion.div 
                className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md text-sm text-green-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {successMessage}
              </motion.div>
            )}
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-[calc(100vh-280px)]">
              {/* Tabs navigation */}
              <div className="md:w-40 lg:w-48 shrink-0">
                <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
                  <TabButton 
                    active={activeTab === "account"} 
                    onClick={() => setActiveTab("account")}
                  >
                    Account
                  </TabButton>
                  <TabButton 
                    active={activeTab === "meditation"} 
                    onClick={() => setActiveTab("meditation")}
                  >
                    Meditation
                  </TabButton>
                  <TabButton 
                    active={activeTab === "wellness"} 
                    onClick={() => setActiveTab("wellness")}
                  >
                    Wellness
                  </TabButton>
                  <TabButton 
                    active={activeTab === "notifications"} 
                    onClick={() => setActiveTab("notifications")}
                  >
                    Notifications
                  </TabButton>
                  <TabButton 
                    active={activeTab === "privacy"} 
                    onClick={() => setActiveTab("privacy")}
                  >
                    Privacy
                  </TabButton>
                </div>
              </div>
              
              {/* Tab content - with scrollable area */}
              <div className="flex-1 overflow-y-auto pr-2">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    {/* Account settings */}
                    {activeTab === "account" && (
                      <form className="space-y-4 md:space-y-5">
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-600 font-light">Email Address</label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-300 px-0 py-2 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                            placeholder="your@email.com"
                          />
                          <p className="text-xs text-gray-500 mt-1">Email changes require verification via email link</p>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-600 font-light">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-300 px-0 py-2 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-600 font-light">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-300 px-0 py-2 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-600 font-light">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-transparent border-b border-gray-300 px-0 py-2 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                            placeholder="••••••••"
                          />
                        </div>
                        
                        <div className="mt-6 pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => signOut()}
                            className="text-xs text-red-600 hover:text-red-800 transition-colors"
                          >
                            Sign out of all devices
                          </button>
                        </div>
                      </form>
                    )}
                    
                    {/* Meditation settings */}
                    {activeTab === "meditation" && (
                      <form className="space-y-5">
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-600 font-light">Voice Preference</label>
                          <div className="flex gap-3">
                            <RadioOption 
                              id="voice-female" 
                              name="voice" 
                              value="female" 
                              checked={meditationVoice === "female"} 
                              onChange={() => setMeditationVoice("female")}
                              label="Female"
                            />
                            <RadioOption 
                              id="voice-male" 
                              name="voice" 
                              value="male" 
                              checked={meditationVoice === "male"} 
                              onChange={() => setMeditationVoice("male")}
                              label="Male"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-600 font-light">Speech Rate</label>
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-500">Slow</span>
                            <input
                              type="range"
                              min="0.5"
                              max="2.0"
                              step="0.1"
                              value={speechRate}
                              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-xs text-gray-500">Fast</span>
                          </div>
                          <p className="text-xs text-gray-500">Current: {speechRate}x</p>
                        </div>
                        
                        <div className="space-y-4">
                          <SwitchOption 
                            id="background-music"
                            checked={backgroundMusic}
                            onChange={() => setBackgroundMusic(!backgroundMusic)}
                            label="Background Music"
                            description="Play ambient music during meditation sessions"
                          />
                          
                          <SwitchOption 
                            id="auto-play"
                            checked={autoPlay}
                            onChange={() => setAutoPlay(!autoPlay)}
                            label="Auto-play Next"
                            description="Automatically start the next meditation in sequence"
                          />
                        </div>
                      </form>
                    )}
                    
                    {/* Wellness settings */}
                    {activeTab === "wellness" && (
                      <form className="space-y-5">
                        <div className="space-y-4">
                          <SwitchOption 
                            id="daily-checkin"
                            checked={dailyCheckIn}
                            onChange={() => setDailyCheckIn(!dailyCheckIn)}
                            label="Daily Check-ins"
                            description="Enable daily wellness check-in prompts"
                          />
                          
                          <SwitchOption 
                            id="mood-reminders"
                            checked={moodReminders}
                            onChange={() => setMoodReminders(!moodReminders)}
                            label="Mood Tracking Reminders"
                            description="Get reminded to log your emotions throughout the day"
                          />
                          
                          <SwitchOption 
                            id="exercise-reminders"
                            checked={exerciseReminders}
                            onChange={() => setExerciseReminders(!exerciseReminders)}
                            label="Wellness Exercise Reminders"
                            description="Receive reminders to practice wellness exercises"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-600 font-light">Safety Plan Access</label>
                          <div className="flex flex-col gap-2">
                            <RadioOption 
                              id="safety-private" 
                              name="safety" 
                              value="private" 
                              checked={safetyPlanAccess === "private"} 
                              onChange={() => setSafetyPlanAccess("private")}
                              label="Private (Only visible to you)"
                            />
                            <RadioOption 
                              id="safety-emergency" 
                              name="safety" 
                              value="emergency" 
                              checked={safetyPlanAccess === "emergency"} 
                              onChange={() => setSafetyPlanAccess("emergency")}
                              label="Emergency contacts can view"
                            />
                          </div>
                        </div>
                      </form>
                    )}
                    
                    {/* Notifications */}
                    {activeTab === "notifications" && (
                      <form className="space-y-5">
                        <div className="space-y-4">
                          <SwitchOption 
                            id="meditation-reminders"
                            checked={meditationReminders}
                            onChange={() => setMeditationReminders(!meditationReminders)}
                            label="Meditation Reminders"
                            description="Get reminded for your daily meditation practice"
                          />
                          
                          <SwitchOption 
                            id="wellness-checkins"
                            checked={wellnessCheckIns}
                            onChange={() => setWellnessCheckIns(!wellnessCheckIns)}
                            label="Wellness Check-ins"
                            description="Receive prompts for mood tracking and wellness exercises"
                          />
                          
                          <SwitchOption 
                            id="chat-notifications"
                            checked={chatNotifications}
                            onChange={() => setChatNotifications(!chatNotifications)}
                            label="Chat Notifications"
                            description="Get notified when Genie has important responses"
                          />
                          
                          <SwitchOption 
                            id="emergency-alerts"
                            checked={emergencyAlerts}
                            onChange={() => setEmergencyAlerts(!emergencyAlerts)}
                            label="Emergency Alerts"
                            description="Receive critical mental health support notifications"
                          />
                        </div>
                      </form>
                    )}
                    
                    {/* Privacy */}
                    {activeTab === "privacy" && (
                      <form className="space-y-5">
                        <div className="space-y-4">
                          <SwitchOption 
                            id="anonymous-mode"
                            checked={anonymousMode}
                            onChange={() => setAnonymousMode(!anonymousMode)}
                            label="Anonymous Mode"
                            description="Hide your profile information from analytics"
                          />
                          
                          <SwitchOption 
                            id="share-progress"
                            checked={shareProgress}
                            onChange={() => setShareProgress(!shareProgress)}
                            label="Share Progress Analytics"
                            description="Help improve Genie by sharing anonymized progress data"
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-600 font-light">Data Retention</label>
                          <select
                            value={dataRetention}
                            onChange={(e) => setDataRetention(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                          >
                            <option value="3months">3 Months</option>
                            <option value="6months">6 Months</option>
                            <option value="1year">1 Year</option>
                            <option value="2years">2 Years</option>
                            <option value="indefinite">Keep Forever</option>
                          </select>
                          <p className="text-xs text-gray-500">How long to keep your mental health data</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="pt-3">
                            <h3 className="text-sm text-gray-800 mb-1">Export Your Data</h3>
                            <p className="text-xs text-gray-600 mb-2">Download your emotions, wellness data, and safety plans</p>
                            <button
                              type="button"
                              className="text-xs text-gray-600 border border-gray-300 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
                              onClick={() => {
                                // In a real implementation, this would trigger a data export
                                alert("Data export feature will be available soon. Your mental health data will be exported in a secure format.")
                              }}
                            >
                              Export My Data
                            </button>
                          </div>
                          
                          <div className="pt-3">
                            <h3 className="text-sm text-gray-800 mb-1">Clear Mental Health Data</h3>
                            <p className="text-xs text-gray-600 mb-2">Remove all emotions, wellness, and safety plan data</p>
                            <button
                              type="button"
                              className="text-xs text-orange-600 border border-orange-200 rounded-full px-4 py-1.5 hover:bg-orange-50 transition-colors"
                              onClick={() => {
                                if (confirm("Are you sure you want to clear all your mental health data? This action cannot be undone.")) {
                                  // In a real implementation, this would clear user data
                                  alert("Data clearing feature will be implemented with proper security measures.")
                                }
                              }}
                            >
                              Clear My Data
                            </button>
                          </div>
                          
                          <div className="pt-3">
                            <h3 className="text-sm text-gray-800 mb-1">Delete Account</h3>
                            <p className="text-xs text-gray-600 mb-2">Permanently delete your account and all data</p>
                            <button
                              type="button"
                              className="text-xs text-red-600 border border-red-200 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete your account? This action cannot be undone and will remove all your data.")) {
                                  // In a real implementation, this would delete the account
                                  alert("Account deletion feature will be implemented with proper security verification.")
                                }
                              }}
                            >
                              Delete Account
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                  
                  {/* Save button - sticky at bottom */}
                  <div className="pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm mt-auto">
                    <motion.button
                      type="button"
                      className="rounded-full w-full px-6 py-2 text-xs font-light text-white bg-black hover:bg-gray-800 transition-colors flex items-center justify-center"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleSave}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      ) : null}
                      Save Changes
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}

// Tab button component
function TabButton({ 
  children, 
  active, 
  onClick 
}: { 
  children: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`text-sm px-4 py-2 rounded-full whitespace-nowrap ${
        active 
          ? "bg-gray-100 text-gray-800" 
          : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
      } transition-colors`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

// Radio option component
function RadioOption({
  id,
  name,
  value,
  checked,
  onChange,
  label
}: {
  id: string
  name: string
  value: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label htmlFor={id} className="flex items-center cursor-pointer">
      <div className="relative">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="sr-only"
        />
        <div className={`w-4 h-4 border rounded-full ${
          checked ? "border-gray-800" : "border-gray-300"
        } transition-colors`}></div>
        {checked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
          </div>
        )}
      </div>
      <span className="ml-2 text-sm text-gray-700">{label}</span>
    </label>
  )
}

// Switch option component
function SwitchOption({
  id,
  checked,
  onChange,
  label,
  description
}: {
  id: string
  checked: boolean
  onChange: () => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 pt-0.5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={onChange}
          className={`relative inline-flex items-center h-5 rounded-full w-10 transition-colors focus:outline-none ${
            checked ? "bg-black" : "bg-gray-200"
          }`}
        >
          <span 
            className={`inline-block w-4 h-4 transform rounded-full bg-white transition-transform ${
              checked ? "translate-x-5" : "translate-x-1"
            }`} 
          />
        </button>
      </div>
      <div className="flex flex-col">
        <label htmlFor={id} className="text-sm text-gray-800 cursor-pointer">
          {label}
        </label>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}