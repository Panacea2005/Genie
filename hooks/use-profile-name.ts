import { useState, useEffect } from 'react'
import { ProfileService } from '@/lib/services/profileService'
import { profileEvents } from '@/lib/services/profileEvents'

export function useProfileName(userId: string | undefined) {
  const [profileName, setProfileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const fetchProfileName = async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const { data: profile, error } = await ProfileService.getProfile(userId)
      
      if (error) {
        console.warn('Could not fetch profile name:', error)
        setError(error)
      }
      
      if (profile?.name) {
        setProfileName(profile.name)
      }
    } catch (err) {
      console.warn('Error fetching profile name:', err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileName()
  }, [userId])

  // Listen for profile update events
  useEffect(() => {
    const unsubscribe = profileEvents.subscribe(() => {
      // Refresh profile name when an update event is triggered
      fetchProfileName()
    })

    return unsubscribe
  }, [userId])

  // Return the profile name, loading state, error, and a refresh function
  return {
    profileName,
    loading,
    error,
    refresh: fetchProfileName
  }
} 