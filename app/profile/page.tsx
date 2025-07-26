"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/app/contexts/AuthContext"
import { ProfileService, Profile } from "@/lib/services/profileService"
import { triggerProfileRefresh } from "@/lib/services/profileEvents"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import GradientSphere from "@/components/gradient-sphere"

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tableNotExists, setTableNotExists] = useState(false)

  // Load profile data when user is available
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return
      
      setIsLoading(true)
      setErrorMessage("")
      setTableNotExists(false)
      
      try {
        const { data, error } = await ProfileService.getProfile(user.id)
        
        if (error) {
          console.error('Error loading profile:', error)
          
          // Check if it's a "table doesn't exist" error
          if (error.message?.includes('relation "profiles" does not exist') || 
              error.code === '42P01') {
            setTableNotExists(true)
            setErrorMessage('Profiles table not set up yet. Please run the SQL setup first.')
            // Fall back to user metadata
            setName(user.user_metadata?.name || user.email?.split('@')[0] || "")
            setBio(user.user_metadata?.bio || "")
            setAvatarUrl(user.user_metadata?.avatar_url || "")
            return
          }
          
          // Check if it's a "no rows" error (profile doesn't exist)
          if (error.code === 'PGRST116') {
            console.log('No profile found, creating one...')
            await createInitialProfile()
            return
          }
          
          // Other errors
          setErrorMessage(`Failed to load profile: ${error.message}`)
          // Fall back to user metadata
          setName(user.user_metadata?.name || user.email?.split('@')[0] || "")
          setBio(user.user_metadata?.bio || "")
          setAvatarUrl(user.user_metadata?.avatar_url || "")
          return
        }
        
        if (data) {
          // Profile exists, use it
          setProfile(data)
          setName(data.name || "")
          setBio(data.bio || "")
          setAvatarUrl(data.avatar_url || "")
        } else {
          // No profile found, create one
          await createInitialProfile()
        }
        
      } catch (error: any) {
        console.error('Unexpected error loading profile:', error)
        setErrorMessage(`An unexpected error occurred: ${error.message}`)
        // Fall back to user metadata
        setName(user.user_metadata?.name || user.email?.split('@')[0] || "")
        setBio(user.user_metadata?.bio || "")
        setAvatarUrl(user.user_metadata?.avatar_url || "")
      } finally {
        setIsLoading(false)
      }
    }

    const createInitialProfile = async () => {
      if (!user) return
      
      try {
        console.log('Creating initial profile for user:', user.id)
        const defaultName = user.user_metadata?.name || user.email?.split('@')[0] || ""
        const defaultBio = user.user_metadata?.bio || ""
        const defaultAvatarUrl = user.user_metadata?.avatar_url || ""
        
        setName(defaultName)
        setBio(defaultBio)
        setAvatarUrl(defaultAvatarUrl)
        
        const { data: newProfile, error: createError } = await ProfileService.createProfile(
          user.id, 
          user.email || "", 
          defaultName
        )
        
        if (createError) {
          console.error('Error creating initial profile:', createError)
          setErrorMessage(`Failed to create profile: ${createError.message}`)
        } else {
          console.log('Profile created successfully:', newProfile)
          setProfile(newProfile)
          setSuccessMessage("Profile created successfully!")
          
          // Trigger profile refresh across all components
          triggerProfileRefresh()
          
          setTimeout(() => setSuccessMessage(""), 3000)
        }
      } catch (error: any) {
        console.error('Unexpected error creating profile:', error)
        setErrorMessage(`Failed to create profile: ${error.message}`)
      }
    }

    if (user) {
      loadProfile()
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    // If table doesn't exist, show error
    if (tableNotExists) {
      setErrorMessage('Cannot save profile: Profiles table not set up. Please run the SQL setup first.')
      return
    }
    
    setIsSaving(true)
    setErrorMessage("")
    setSuccessMessage("")
    
    try {
      const updates = {
        name: name.trim() || null,
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null
      }
      
      let result
      
      // If no profile exists yet, create one, otherwise update
      if (!profile) {
        result = await ProfileService.upsertProfile(user.id, {
          ...updates,
          email: user.email || ""
        })
      } else {
        result = await ProfileService.updateProfile(user.id, updates)
      }
      
      const { data, error } = result
      
      if (error) {
        console.error('Error saving profile:', error)
        setErrorMessage(`Failed to save profile: ${error.message}`)
      } else {
        setProfile(data)
        setSuccessMessage("Profile updated successfully!")
        
        // Trigger profile refresh across all components
        triggerProfileRefresh()
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage("")
        }, 3000)
      }
    } catch (error: any) {
      console.error('Unexpected error saving profile:', error)
      setErrorMessage(`An unexpected error occurred: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 text-sm">Loading profile...</p>
        </div>
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
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-gray-200 mr-6 flex-shrink-0"
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
                className={`w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center text-gray-800 text-xl mr-6 flex-shrink-0 ${avatarUrl ? 'hidden' : ''}`}
              >
                {name.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-light text-gray-800">Your Profile</h1>
                <p className="text-xs md:text-sm text-gray-500">{user.email}</p>
                {profile && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                  </p>
                )}
                {tableNotExists && (
                  <p className="text-xs text-orange-500 mt-1">
                    ⚠️ Using fallback data - database not configured
                  </p>
                )}
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
            
            {/* Error message */}
            {errorMessage && (
              <motion.div 
                className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md text-sm text-red-600"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {errorMessage}
                {tableNotExists && (
                  <div className="mt-2 text-xs">
                    <p><strong>To fix this:</strong></p>
                    <ol className="list-decimal list-inside mt-1 space-y-1">
                      <li>Go to your Supabase Dashboard → SQL Editor</li>
                      <li>Run the SQL from <code>supabase_profiles_setup.sql</code></li>
                      <li>Then run <code>migration_create_missing_profiles.sql</code></li>
                      <li>Refresh this page</li>
                    </ol>
                  </div>
                )}
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
                  maxLength={100}
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
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {bio.length}/500 characters
                </p>
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs text-gray-600 font-light">Avatar URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full bg-transparent border-b border-gray-300 px-0 py-3 text-gray-800 text-sm focus:outline-none focus:border-b-gray-500 transition-colors"
                  placeholder="https://example.com/your-avatar.jpg"
                />
                {avatarUrl && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 font-light mb-2">Avatar Preview:</p>
                    <div className="flex items-center gap-3">
                      <img
                        src={avatarUrl}
                        alt="Avatar preview"
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling!.classList.remove('hidden');
                        }}
                        onLoad={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'block';
                          target.nextElementSibling!.classList.add('hidden');
                        }}
                      />
                      <div className="hidden text-xs text-red-500 bg-red-50 px-2 py-1 rounded">
                        ⚠️ Unable to load image from this URL
                      </div>
                      <div className="text-xs text-gray-500">
                        This will be your new avatar
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end pt-4">
                <motion.button
                  type="submit"
                  className="rounded-full px-6 py-2 text-xs font-light text-white bg-black hover:bg-gray-800 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: isSaving ? 1 : 1.03 }}
                  whileTap={{ scale: isSaving ? 1 : 0.97 }}
                  disabled={isSaving || tableNotExists}
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {isSaving ? 'Saving...' : tableNotExists ? 'Setup Required' : 'Save Changes'}
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