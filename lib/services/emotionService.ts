import { supabase } from '../supabase/supabaseClient'

// Types
export interface EmotionType {
  id: string
  name: string
  description: string | null
  color: string
  icon_name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmotionEntry {
  id: number
  user_id: string
  emotion_type_id: string
  intensity: number
  notes: string | null
  created_at: string
  updated_at: string
  location?: string | null
  weather?: string | null
  tags?: string[] | null
  
  // Joined data from emotion_types
  emotion_type?: EmotionType
}

export interface CreateEmotionEntry {
  emotion_type_id: string
  intensity: number
  notes?: string | null
  location?: string | null
  weather?: string | null
  tags?: string[] | null
}

export interface EmotionSummary {
  total_entries: number
  avg_intensity: number
  emotions_felt: string[]
  last_entry_time: string
  entry_date: string
}

export interface EmotionTrend {
  emotion_type_id: string
  entry_count: number
  avg_intensity: number
  min_intensity: number
  max_intensity: number
  week_start: string
}

export class EmotionService {
  // Get all emotion types
  static async getEmotionTypes(): Promise<{ data: EmotionType[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('emotion_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

      return { data, error }
    } catch (error) {
      console.error('Error fetching emotion types:', error)
      return { data: null, error }
    }
  }

  // Create a new emotion entry
  static async createEmotionEntry(userId: string, entry: CreateEmotionEntry): Promise<{ data: EmotionEntry | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('emotion_entries')
        .insert({
          user_id: userId,
          ...entry
        })
        .select(`
          *,
          emotion_type:emotion_types(*)
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error creating emotion entry:', error)
      return { data: null, error }
    }
  }

  // Get user's emotion entries with pagination
  static async getEmotionEntries(userId: string, limit = 10, offset = 0): Promise<{ data: EmotionEntry[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('emotion_entries')
        .select(`
          *,
          emotion_type:emotion_types(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      return { data, error }
    } catch (error) {
      console.error('Error fetching emotion entries:', error)
      return { data: null, error }
    }
  }

  // Get today's emotion entries
  static async getTodayEmotionEntries(userId: string): Promise<{ data: EmotionEntry[] | null; error: any }> {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const { data, error } = await supabase
        .from('emotion_entries')
        .select(`
          *,
          emotion_type:emotion_types(*)
        `)
        .eq('user_id', userId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error fetching today\'s emotion entries:', error)
      return { data: null, error }
    }
  }

  // Get daily emotion summary
  static async getDailyEmotionSummary(userId: string, date?: string): Promise<{ data: EmotionSummary | null; error: any }> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('daily_emotion_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('entry_date', targetDate)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error fetching daily emotion summary:', error)
      return { data: null, error }
    }
  }

  // Get weekly emotion trends
  static async getWeeklyEmotionTrends(userId: string, weeksBack = 4): Promise<{ data: EmotionTrend[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('weekly_emotion_trends')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start', new Date(Date.now() - weeksBack * 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('week_start', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error fetching weekly emotion trends:', error)
      return { data: null, error }
    }
  }

  // Update an emotion entry
  static async updateEmotionEntry(entryId: number, updates: Partial<CreateEmotionEntry>): Promise<{ data: EmotionEntry | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('emotion_entries')
        .update(updates)
        .eq('id', entryId)
        .select(`
          *,
          emotion_type:emotion_types(*)
        `)
        .single()

      return { data, error }
    } catch (error) {
      console.error('Error updating emotion entry:', error)
      return { data: null, error }
    }
  }

  // Delete an emotion entry
  static async deleteEmotionEntry(entryId: number): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('emotion_entries')
        .delete()
        .eq('id', entryId)

      return { error }
    } catch (error) {
      console.error('Error deleting emotion entry:', error)
      return { error }
    }
  }

  // Get emotion statistics for insights
  static async getEmotionInsights(userId: string): Promise<{ 
    todayEntries: number;
    avgIntensity: number;
    mostCommonEmotion: string | null;
    trendDirection: 'up' | 'down' | 'stable';
    comparisonText: string;
    error: any 
  }> {
    try {
      // Get today's summary
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const [todayResult, yesterdayResult] = await Promise.all([
        this.getDailyEmotionSummary(userId, today),
        this.getDailyEmotionSummary(userId, yesterday)
      ])

      const todayData = todayResult.data
      const yesterdayData = yesterdayResult.data

      const todayEntries = todayData?.total_entries || 0
      const avgIntensity = todayData?.avg_intensity || 0
      const yesterdayAvg = yesterdayData?.avg_intensity || 0

      // Determine trend
      let trendDirection: 'up' | 'down' | 'stable' = 'stable'
      let comparisonText = 'Similar to yesterday'

      if (avgIntensity > yesterdayAvg + 0.5) {
        trendDirection = 'up'
        const improvement = Math.round(((avgIntensity - yesterdayAvg) / yesterdayAvg) * 100)
        comparisonText = `Feeling ${improvement}% better than yesterday`
      } else if (avgIntensity < yesterdayAvg - 0.5) {
        trendDirection = 'down'
        const decline = Math.round(((yesterdayAvg - avgIntensity) / yesterdayAvg) * 100)
        comparisonText = `${decline}% lower intensity than yesterday`
      }

      // Get most common emotion from recent entries
      const { data: recentEntries } = await this.getEmotionEntries(userId, 10)
      const emotionCounts: { [key: string]: number } = {}
      
      recentEntries?.forEach(entry => {
        if (entry.emotion_type?.name) {
          emotionCounts[entry.emotion_type.name] = (emotionCounts[entry.emotion_type.name] || 0) + 1
        }
      })

      const mostCommonEmotion = Object.keys(emotionCounts).reduce((a, b) => 
        emotionCounts[a] > emotionCounts[b] ? a : b, Object.keys(emotionCounts)[0]
      ) || null

      return {
        todayEntries,
        avgIntensity,
        mostCommonEmotion,
        trendDirection,
        comparisonText,
        error: null
      }
    } catch (error) {
      console.error('Error getting emotion insights:', error)
      return {
        todayEntries: 0,
        avgIntensity: 0,
        mostCommonEmotion: null,
        trendDirection: 'stable',
        comparisonText: 'Unable to calculate trends',
        error
      }
    }
  }

  // Get weekly emotion insights
  static async getWeeklyEmotionInsights(userId: string): Promise<{
    thisWeekEntries: number;
    lastWeekEntries: number;
    thisWeekAvgIntensity: number;
    lastWeekAvgIntensity: number;
    weeklyComparison: string;
    weeklyInsight: string;
    error: any;
  }> {
    try {
      // Calculate week boundaries (Monday to Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days to get to Monday
      startOfWeek.setDate(now.getDate() - daysToMonday);
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);
      
      const startOfLastWeek = new Date(startOfWeek);
      startOfLastWeek.setDate(startOfWeek.getDate() - 7);
      
      const endOfLastWeek = new Date(startOfWeek);

      // Get entries for this week and last week
      const [thisWeekResult, lastWeekResult] = await Promise.all([
        supabase
          .from('emotion_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startOfWeek.toISOString())
          .lt('created_at', endOfWeek.toISOString()),
        supabase
          .from('emotion_entries')
          .select('*')
          .eq('user_id', userId)
          .gte('created_at', startOfLastWeek.toISOString())
          .lt('created_at', endOfLastWeek.toISOString())
      ]);

      const thisWeekEntries = thisWeekResult.data || [];
      const lastWeekEntries = lastWeekResult.data || [];

      // Debug logging
      console.log('Weekly calculation debug:', {
        startOfWeek: startOfWeek.toISOString(),
        endOfWeek: endOfWeek.toISOString(),
        thisWeekEntriesCount: thisWeekEntries.length,
        thisWeekEntriesDates: thisWeekEntries.map(e => new Date(e.created_at).toISOString().split('T')[0])
      });

      // Calculate averages
      const thisWeekAvgIntensity = thisWeekEntries.length > 0 
        ? thisWeekEntries.reduce((sum, entry) => sum + entry.intensity, 0) / thisWeekEntries.length 
        : 0;
      
      const lastWeekAvgIntensity = lastWeekEntries.length > 0 
        ? lastWeekEntries.reduce((sum, entry) => sum + entry.intensity, 0) / lastWeekEntries.length 
        : 0;

      // Determine weekly comparison
      let weeklyComparison = 'Similar to last week';
      let weeklyInsight = '';

      if (thisWeekEntries.length === 0 && lastWeekEntries.length === 0) {
        weeklyComparison = 'No data to compare';
        weeklyInsight = 'Start tracking your emotions to see weekly insights!';
      } else if (thisWeekEntries.length === 0) {
        weeklyComparison = 'No entries this week yet';
        weeklyInsight = 'Begin your week by logging your first emotion.';
      } else if (lastWeekEntries.length === 0) {
        weeklyComparison = 'First week of tracking!';
        weeklyInsight = 'Great start! Keep logging your emotions to build meaningful insights.';
      } else if (thisWeekEntries.length < 3) {
        // Not enough data this week for meaningful comparison
        weeklyComparison = 'Building this week\'s data';
        weeklyInsight = `You've logged ${thisWeekEntries.length} entries this week. Add more entries to see weekly trends.`;
      } else {
        // Enough data for comparison
        const intensityDiff = thisWeekAvgIntensity - lastWeekAvgIntensity;
        const entryDiff = thisWeekEntries.length - lastWeekEntries.length;
        
        if (Math.abs(intensityDiff) < 0.5) {
          weeklyComparison = 'Similar emotional intensity to last week';
          weeklyInsight = 'Your emotional patterns are consistent. Consider what\'s working well for you.';
        } else if (intensityDiff > 0.5) {
          const improvement = Math.round((intensityDiff / lastWeekAvgIntensity) * 100);
          weeklyComparison = `${improvement}% better emotional state than last week`;
          weeklyInsight = 'You\'re showing positive emotional growth! Keep up the great work.';
        } else {
          const decline = Math.round((Math.abs(intensityDiff) / lastWeekAvgIntensity) * 100);
          weeklyComparison = `${decline}% lower intensity than last week`;
          weeklyInsight = 'You might be experiencing more challenging emotions. Remember, it\'s okay to seek support.';
        }
      }

      return {
        thisWeekEntries: thisWeekEntries.length,
        lastWeekEntries: lastWeekEntries.length,
        thisWeekAvgIntensity,
        lastWeekAvgIntensity,
        weeklyComparison,
        weeklyInsight,
        error: null
      };
    } catch (error) {
      console.error('Error getting weekly emotion insights:', error);
      return {
        thisWeekEntries: 0,
        lastWeekEntries: 0,
        thisWeekAvgIntensity: 0,
        lastWeekAvgIntensity: 0,
        weeklyComparison: 'Unable to calculate weekly trends',
        weeklyInsight: 'There was an error loading your weekly insights.',
        error
      };
    }
  }

  // Helper function to format relative time
  static formatRelativeTime(timestamp: string): string {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hours ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return 'Yesterday'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return past.toLocaleDateString()
  }
} 