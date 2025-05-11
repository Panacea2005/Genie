"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/app/contexts/AuthContext"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || user.email?.split('@')[0] || "")
      setBio(user.user_metadata?.bio || "")
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    // Simulate API call to update profile
    setTimeout(() => {
      setIsSaving(false)
      setSuccessMessage("Profile updated successfully")
      
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
        <p className="text-gray-600">Please sign in to view your profile.</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Background subtle gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-white via-gray-50 to-gray-100 -z-10" />
      
      {/* Navbar */}
      <Navbar currentPage="profile" />
      
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 overflow-hidden">
        <div className="relative w-full max-w-3xl">
          {/* Background sphere positioned to the side */}
          <div className="absolute -left-32 -top-32 opacity-50 pointer-events-none">
            <GradientSphere />
          </div>
          
          <motion.div 
            className="relative z-10 bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-gray-100 max-h-[calc(100vh-160px)] overflow-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-gray-800 text-xl mr-6 flex-shrink-0">
                {name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-light text-gray-800">Your Profile</h1>
                <p className="text-xs md:text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            
            {/* Success message */}
            {successMessage && (
              <motion.div 
                className="mb-6 p-4 bg-green-50 border border-green-100 rounded-md text-sm text-green-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {successMessage}
              </motion.div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="block text-xs text-gray-600 font-light">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 px-0 py-3 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-600 font-light">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 px-0 py-3 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors resize-none"
                  placeholder="Tell us a bit about yourself"
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <motion.button
                  type="submit"
                  className="rounded-full px-6 py-2 text-xs font-light text-white bg-black hover:bg-gray-800 transition-colors flex items-center"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  Save Changes
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
      
      {/* Footer */}
      <Footer />
    </div>
  )
}