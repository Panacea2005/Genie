import { supabase } from '../supabase/supabaseClient'

export interface Profile {
  id: string
  email: string | null
  name: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileUpdate {
  name?: string | null
  bio?: string | null
  avatar_url?: string | null
}

export class ProfileService {
  // Get user profile with better error handling
  static async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows returned - this is expected for new users
          return { data: null, error: null }
        }
        if (error.message?.includes('relation "profiles" does not exist')) {
          console.warn('Profiles table does not exist yet')
          return { data: null, error: { code: 'TABLE_NOT_EXISTS', message: 'Profiles table not set up' } }
        }
      }

      return { data, error }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      return { data: null, error }
    }
  }

  // Create or update profile
  static async upsertProfile(userId: string, updates: ProfileUpdate & { email?: string }): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      return { data, error }
    } catch (error: any) {
      console.error('Error upserting profile:', error)
      return { data: null, error }
    }
  }

  // Update profile
  static async updateProfile(userId: string, updates: ProfileUpdate): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      return { data, error }
    } catch (error: any) {
      console.error('Error updating profile:', error)
      return { data: null, error }
    }
  }

  // Create initial profile with conflict handling
  static async createProfile(userId: string, email: string, name?: string): Promise<{ data: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          name: name || email.split('@')[0], // Default name from email
          bio: null,
          avatar_url: null
        })
        .select()
        .single()

      // Handle duplicate key error (profile already exists)
      if (error && error.code === '23505') {
        console.log('Profile already exists for user:', userId)
        // Return the existing profile instead
        return await this.getProfile(userId)
      }

      return { data, error }
    } catch (error: any) {
      console.error('Error creating profile:', error)
      return { data: null, error }
    }
  }

  // Delete profile
  static async deleteProfile(userId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      return { error }
    } catch (error: any) {
      console.error('Error deleting profile:', error)
      return { error }
    }
  }
} 