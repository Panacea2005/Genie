import { supabase } from '@/lib/supabase/supabaseClient'

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface WellnessExercise {
  id: string
  name: string
  description: string
  duration_seconds: number
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  color: string
  icon_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface WellnessCompletion {
  id: string
  user_id: string
  exercise_id: string
  completed_at: string
  actual_duration_seconds?: number
  notes?: string
  mood_before?: string
  mood_after?: string
  rating?: number
  created_at: string
  // Joined exercise data
  exercise?: WellnessExercise
}

export interface WellnessStats {
  completions_today: number
  total_practice_time_today: number // in seconds
  streak_days: number
  total_completions: number
  avg_rating: number
  categories_practiced: string[]
  most_recent_mood?: string
}

export interface TodaysCompletion {
  exercise_id: string
  exercise_name: string
  category: string
  completed_at: string
  actual_duration_seconds?: number
  rating?: number
}

// =============================================================================
// WELLNESS SERVICE
// =============================================================================

export class WellnessService {
  // Get all available wellness exercises
  static async getWellnessExercises(): Promise<{
    data: WellnessExercise[] | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('wellness_exercises')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching wellness exercises:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Error in getWellnessExercises:', error)
      return { data: null, error: error.message || 'Failed to fetch wellness exercises' }
    }
  }

  // Get user's wellness completions with optional limit
  static async getWellnessCompletions(
    userId: string, 
    limit?: number
  ): Promise<{
    data: WellnessCompletion[] | null
    error: string | null
  }> {
    try {
      let query = supabase
        .from('wellness_completions')
        .select(`
          *,
          exercise:wellness_exercises(*)
        `)
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching wellness completions:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Error in getWellnessCompletions:', error)
      return { data: null, error: error.message || 'Failed to fetch wellness completions' }
    }
  }

  // Get today's completions for a user
  static async getTodaysCompletions(userId: string): Promise<{
    data: TodaysCompletion[] | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_todays_wellness_completions', { p_user_id: userId })

      if (error) {
        console.error('Error fetching todays completions:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Error in getTodaysCompletions:', error)
      return { data: null, error: error.message || 'Failed to fetch today\'s completions' }
    }
  }

  // Complete a wellness exercise
  static async completeExercise(
    userId: string,
    exerciseId: string,
    options?: {
      actualDurationSeconds?: number
      notes?: string
      moodBefore?: string
      moodAfter?: string
      rating?: number
    }
  ): Promise<{
    data: { id: string } | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .rpc('complete_wellness_exercise', {
          p_user_id: userId,
          p_exercise_id: exerciseId,
          p_actual_duration_seconds: options?.actualDurationSeconds || null,
          p_notes: options?.notes || null,
          p_mood_before: options?.moodBefore || null,
          p_mood_after: options?.moodAfter || null,
          p_rating: options?.rating || null
        })

      if (error) {
        console.error('Error completing exercise:', error)
        return { data: null, error: error.message }
      }

      return { data: { id: data }, error: null }
    } catch (error: any) {
      console.error('Error in completeExercise:', error)
      return { data: null, error: error.message || 'Failed to complete exercise' }
    }
  }

  // Get user's wellness streak
  static async getWellnessStreak(userId: string): Promise<{
    data: number | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .rpc('get_wellness_streak', { p_user_id: userId })

      if (error) {
        console.error('Error fetching wellness streak:', error)
        return { data: null, error: error.message }
      }

      return { data: data || 0, error: null }
    } catch (error: any) {
      console.error('Error in getWellnessStreak:', error)
      return { data: null, error: error.message || 'Failed to fetch wellness streak' }
    }
  }

  // Get comprehensive wellness statistics for a user
  static async getWellnessStats(userId: string): Promise<{
    data: WellnessStats | null
    error: string | null
  }> {
    try {
      // Get today's completions and streak in parallel
      const [todaysResult, streakResult, recentResult] = await Promise.all([
        this.getTodaysCompletions(userId),
        this.getWellnessStreak(userId),
        this.getWellnessCompletions(userId, 50) // Get recent completions for stats
      ])

      if (todaysResult.error) {
        return { data: null, error: todaysResult.error }
      }
      if (streakResult.error) {
        return { data: null, error: streakResult.error }
      }
      if (recentResult.error) {
        return { data: null, error: recentResult.error }
      }

      const todaysCompletions = todaysResult.data || []
      const streak = streakResult.data || 0
      const recentCompletions = recentResult.data || []

      // Calculate today's practice time
      const totalPracticeTimeToday = todaysCompletions.reduce((sum, completion) => {
        return sum + (completion.actual_duration_seconds || 0)
      }, 0)

      // Get categories practiced today
      const categoriesToday = [...new Set(todaysCompletions.map(c => c.category))]

      // Calculate average rating from recent completions
      const ratingsWithValues = recentCompletions.filter(c => c.rating !== null && c.rating !== undefined)
      const avgRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, c) => sum + (c.rating || 0), 0) / ratingsWithValues.length
        : 0

      // Get most recent mood
      const mostRecentCompletion = recentCompletions.find(c => c.mood_after)
      const mostRecentMood = mostRecentCompletion?.mood_after

      const stats: WellnessStats = {
        completions_today: todaysCompletions.length,
        total_practice_time_today: totalPracticeTimeToday,
        streak_days: streak,
        total_completions: recentCompletions.length,
        avg_rating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        categories_practiced: categoriesToday,
        most_recent_mood: mostRecentMood || undefined
      }

      return { data: stats, error: null }
    } catch (error: any) {
      console.error('Error in getWellnessStats:', error)
      return { data: null, error: error.message || 'Failed to fetch wellness statistics' }
    }
  }

  // Get wellness completions by date range
  static async getCompletionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    data: WellnessCompletion[] | null
    error: string | null
  }> {
    try {
      const { data, error } = await supabase
        .from('wellness_completions')
        .select(`
          *,
          exercise:wellness_exercises(*)
        `)
        .eq('user_id', userId)
        .gte('completed_at', startDate)
        .lte('completed_at', endDate)
        .order('completed_at', { ascending: false })

      if (error) {
        console.error('Error fetching completions by date range:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Error in getCompletionsByDateRange:', error)
      return { data: null, error: error.message || 'Failed to fetch completions by date range' }
    }
  }

  // Update a completion (for editing notes, rating, etc.)
  static async updateCompletion(
    completionId: string,
    updates: {
      notes?: string
      rating?: number
      moodAfter?: string
    }
  ): Promise<{
    data: WellnessCompletion | null
    error: string | null
  }> {
    try {
      const updateData: any = {}
      if (updates.notes !== undefined) updateData.notes = updates.notes
      if (updates.rating !== undefined) updateData.rating = updates.rating
      if (updates.moodAfter !== undefined) updateData.mood_after = updates.moodAfter

      const { data, error } = await supabase
        .from('wellness_completions')
        .update(updateData)
        .eq('id', completionId)
        .select(`
          *,
          exercise:wellness_exercises(*)
        `)
        .single()

      if (error) {
        console.error('Error updating completion:', error)
        return { data: null, error: error.message }
      }

      return { data: data || null, error: null }
    } catch (error: any) {
      console.error('Error in updateCompletion:', error)
      return { data: null, error: error.message || 'Failed to update completion' }
    }
  }

  // Delete a completion
  static async deleteCompletion(completionId: string): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      const { error } = await supabase
        .from('wellness_completions')
        .delete()
        .eq('id', completionId)

      if (error) {
        console.error('Error deleting completion:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error('Error in deleteCompletion:', error)
      return { success: false, error: error.message || 'Failed to delete completion' }
    }
  }

  // Create sample data for testing
  static async createSampleData(userId: string): Promise<{
    success: boolean
    error: string | null
  }> {
    try {
      const { error } = await supabase
        .rpc('create_sample_wellness_data', { p_user_id: userId })

      if (error) {
        console.error('Error creating sample wellness data:', error)
        return { success: false, error: error.message }
      }

      return { success: true, error: null }
    } catch (error: any) {
      console.error('Error in createSampleData:', error)
      return { success: false, error: error.message || 'Failed to create sample data' }
    }
  }

  // Get wellness analytics - weekly trends
  static async getWeeklyTrends(userId: string, weeks: number = 4): Promise<{
    data: any[] | null
    error: string | null
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - (weeks * 7))

      const { data, error } = await supabase
        .from('wellness_weekly_trends')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start', startDate.toISOString())
        .order('week_start', { ascending: true })

      if (error) {
        console.error('Error fetching weekly trends:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error: any) {
      console.error('Error in getWeeklyTrends:', error)
      return { data: null, error: error.message || 'Failed to fetch weekly trends' }
    }
  }

  // Helper function to format duration
  static formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes === 0) {
      return `${remainingSeconds}s`
    } else if (remainingSeconds === 0) {
      return `${minutes}m`
    } else {
      return `${minutes}m ${remainingSeconds}s`
    }
  }

  // Helper function to get relative time
  static getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Helper function to get difficulty color
  static getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'beginner':
        return '#10b981' // emerald-500
      case 'intermediate':
        return '#f59e0b' // amber-500
      case 'advanced':
        return '#ef4444' // red-500
      default:
        return '#6b7280' // gray-500
    }
  }

  // Helper function to get category display name
  static getCategoryDisplayName(category: string): string {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }
}

export default WellnessService 