"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/app/contexts/AuthContext"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

type SettingsTab = "account" | "preferences" | "notifications" | "privacy"

export default function SettingsPage() {
  const { user, loading, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>("account")
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  
  // Account settings states
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  
  // Preferences states
  const [theme, setTheme] = useState("light")
  const [language, setLanguage] = useState("english")
  
  // Notification states
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [appNotifs, setAppNotifs] = useState(true)
  
  // Privacy states
  const [dataSharing, setDataSharing] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Simulate API call to update settings
    setTimeout(() => {
      setIsSaving(false)
      setSuccessMessage("Settings saved successfully")
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("")
      }, 3000)
    }, 1000)
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
                    active={activeTab === "preferences"} 
                    onClick={() => setActiveTab("preferences")}
                  >
                    Preferences
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
                    
                    {/* Preferences */}
                    {activeTab === "preferences" && (
                      <form className="space-y-5">
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-600 font-light">Theme</label>
                          <div className="flex gap-3">
                            <RadioOption 
                              id="theme-light" 
                              name="theme" 
                              value="light" 
                              checked={theme === "light"} 
                              onChange={() => setTheme("light")}
                              label="Light"
                            />
                            <RadioOption 
                              id="theme-dark" 
                              name="theme" 
                              value="dark" 
                              checked={theme === "dark"} 
                              onChange={() => setTheme("dark")}
                              label="Dark"
                            />
                            <RadioOption 
                              id="theme-system" 
                              name="theme" 
                              value="system" 
                              checked={theme === "system"} 
                              onChange={() => setTheme("system")}
                              label="System"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="block text-xs text-gray-600 font-light">Language</label>
                          <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
                          >
                            <option value="english">English</option>
                            <option value="spanish">Spanish</option>
                            <option value="french">French</option>
                            <option value="german">German</option>
                            <option value="japanese">Japanese</option>
                          </select>
                        </div>
                      </form>
                    )}
                    
                    {/* Notifications */}
                    {activeTab === "notifications" && (
                      <form className="space-y-5">
                        <div className="space-y-4">
                          <SwitchOption 
                            id="email-notifications"
                            checked={emailNotifs}
                            onChange={() => setEmailNotifs(!emailNotifs)}
                            label="Email Notifications"
                            description="Receive updates, news, and important alerts via email"
                          />
                          
                          <SwitchOption 
                            id="app-notifications"
                            checked={appNotifs}
                            onChange={() => setAppNotifs(!appNotifs)}
                            label="In-App Notifications"
                            description="Receive notifications within the Genie app"
                          />
                        </div>
                      </form>
                    )}
                    
                    {/* Privacy */}
                    {activeTab === "privacy" && (
                      <form className="space-y-5">
                        <div className="space-y-4">
                          <SwitchOption 
                            id="data-sharing"
                            checked={dataSharing}
                            onChange={() => setDataSharing(!dataSharing)}
                            label="Data Sharing"
                            description="Allow Genie to use your data to improve the service"
                          />
                          
                          <div className="pt-3">
                            <h3 className="text-sm text-gray-800 mb-1">Data Export</h3>
                            <p className="text-xs text-gray-600 mb-2">Download a copy of your data</p>
                            <button
                              type="button"
                              className="text-xs text-gray-600 border border-gray-300 rounded-full px-4 py-1.5 hover:bg-gray-50 transition-colors"
                            >
                              Request Data Export
                            </button>
                          </div>
                          
                          <div className="pt-3">
                            <h3 className="text-sm text-gray-800 mb-1">Delete Account</h3>
                            <p className="text-xs text-gray-600 mb-2">Permanently delete your account and all data</p>
                            <button
                              type="button"
                              className="text-xs text-red-600 border border-red-200 rounded-full px-4 py-1.5 hover:bg-red-50 transition-colors"
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