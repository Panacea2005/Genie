import { useState, useEffect } from 'react'
import { ProfileService, Profile } from '@/lib/services/profileService'
import { profileEvents } from '@/lib/services/profileEvents'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchProfile = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data: profileData, error } = await ProfileService.getProfile(userId)
      
      if (error) {
        console.warn('Could not fetch profile:', error)
        setError(error)
      }
      
      if (profileData) {
        setProfile(profileData)
      }
    } catch (err) {
      console.warn('Error fetching profile:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [userId])

  // Listen for profile update events
  useEffect(() => {
    const unsubscribe = profileEvents.subscribe(() => {
      // Refresh profile when an update event is triggered
      fetchProfile()
    })

    return unsubscribe
  }, [userId])

  // Return the complete profile, loading state, error, and a refresh function
  return {
    profile,
    loading,
    error,
    refresh: fetchProfile,
    // Convenience accessors
    name: profile?.name,
    avatarUrl: profile?.avatar_url,
    bio: profile?.bio,
    email: profile?.email
  }
} 