import { createClient } from '@supabase/supabase-js'

// Types
export type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
}

// New Mental Health Context tracking
export interface MoodEntry {
  mood: string
  intensity: number // 1-10 scale
  timestamp: Date
  notes?: string
}

export interface MentalHealthContext {
  reportedMoods: MoodEntry[]
  mentionedSymptoms: string[]
  techniquesRecommended: string[]
  resourcesShared: string[]
  lastCrisisCheck: Date | null
  topicSensitivity: {
    [key: string]: number // 1-5 scale of sensitivity
  }
  wellnessGoals: string[]
  copingStrategiesUsed: string[]
  supportNetwork: string[]
  safetyPlan?: {
    warningSigns: string[]
    copingStrategies: string[]
    contacts: { name: string, relationship: string, phone?: string }[]
    resources: string[]
    safeEnvironment: string[]
  }
}

// Initialize empty mental health context
function initMentalHealthContext(): MentalHealthContext {
  return {
    reportedMoods: [],
    mentionedSymptoms: [],
    techniquesRecommended: [],
    resourcesShared: [],
    lastCrisisCheck: null,
    topicSensitivity: {},
    wellnessGoals: [],
    copingStrategiesUsed: [],
    supportNetwork: []
  };
}

export type ChatHistory = {
  id: number
  title: string
  date: string
  messages: Message[]
  pinned?: boolean
  user_id: string // Changed to snake_case to match Supabase table
  mentalHealthContext?: MentalHealthContext
}

// Initialize Supabase client - with fallbacks for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-placeholder'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For development fallback when Supabase isn't configured
const useLocalStorageFallback = supabaseUrl.includes('your-project-id')

export const chatStore = {
  // Get chat history from Supabase or localStorage fallback
  getChatHistory: async (userId: string): Promise<ChatHistory[]> => {
    // Fallback to localStorage if Supabase is not configured
    if (useLocalStorageFallback) {
      console.warn('Using localStorage fallback instead of Supabase. Please configure Supabase.')
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('chatHistory')
        return stored ? JSON.parse(stored) : []
      }
      return []
    }
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId) // Changed to snake_case
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching chat history:', error)
        return []
      }
      
      // Initialize mental health context if it doesn't exist
      return data?.map(chat => ({
        ...chat,
        mentalHealthContext: chat.mentalHealthContext || initMentalHealthContext()
      })) || []
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return []
    }
  },
  
  // Get a specific chat by ID
  getChatById: async (chatId: number): Promise<ChatHistory | null> => {
    // Fallback to localStorage if Supabase is not configured
    if (useLocalStorageFallback) {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('chatHistory')
        if (stored) {
          const history = JSON.parse(stored)
          const chat = history.find((c: ChatHistory) => c.id === chatId)
          return chat || null
        }
      }
      return null
    }
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single()
      
      if (error) {
        console.error('Error fetching chat:', error)
        return null
      }
      
      // Initialize mental health context if it doesn't exist
      return data ? {
        ...data,
        mentalHealthContext: data.mentalHealthContext || initMentalHealthContext()
      } : null
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return null
    }
  },
  
  // Save a new chat to Supabase or localStorage fallback
  saveChat: async (chat: ChatHistory): Promise<ChatHistory | null> => {
    // Initialize mental health context if it doesn't exist
    if (!chat.mentalHealthContext) {
      chat.mentalHealthContext = initMentalHealthContext()
    }
    
    // Fallback to localStorage if Supabase is not configured
    if (useLocalStorageFallback) {
      if (typeof window !== 'undefined') {
        // Get current history from localStorage
        const stored = localStorage.getItem('chatHistory')
        const history = stored ? JSON.parse(stored) : []
        
        // Add new chat to history
        const updatedHistory = [chat, ...history.filter((c: ChatHistory) => c.id !== chat.id)]
        localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
        return chat
      }
      return null
    }
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert([chat])
        .select()
      
      if (error) {
        console.error('Error saving chat:', error)
        return null
      }
      
      return data?.[0] || null
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return null
    }
  },
  
  // Update an existing chat in Supabase or localStorage fallback
  updateChat: async (id: number, updates: Partial<ChatHistory>): Promise<boolean> => {
    // Fallback to localStorage if Supabase is not configured
    if (useLocalStorageFallback) {
      if (typeof window !== 'undefined') {
        const storedHistory = localStorage.getItem('chatHistory')
        if (storedHistory) {
          const history = JSON.parse(storedHistory)
          const chatIndex = history.findIndex((c: { id: number }) => c.id === id)
          if (chatIndex >= 0) {
            history[chatIndex] = { ...history[chatIndex], ...updates }
            localStorage.setItem('chatHistory', JSON.stringify(history))
            return true
          }
        }
      }
      return false
    }
    
    try {
      const { error } = await supabase
        .from('chats')
        .update(updates)
        .eq('id', id)
      
      if (error) {
        console.error('Error updating chat:', error)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return false
    }
  },
  
  // Update mental health context specifically
  updateMentalHealthContext: async (
    chatId: number,
    updates: Partial<MentalHealthContext>
  ): Promise<boolean> => {
    try {
      const chat = await chatStore.getChatById(chatId);
      if (!chat) return false;
      
      const currentContext = chat.mentalHealthContext || initMentalHealthContext();
      const updatedContext = { ...currentContext, ...updates };
      
      return await chatStore.updateChat(chatId, { mentalHealthContext: updatedContext });
    } catch (err) {
      console.error('Error updating mental health context:', err);
      return false;
    }
  },
  
  // Add a mood entry to the mental health context
  addMoodEntry: async (
    chatId: number,
    mood: string,
    intensity: number,
    notes?: string
  ): Promise<boolean> => {
    try {
      const chat = await chatStore.getChatById(chatId);
      if (!chat) return false;
      
      const currentContext = chat.mentalHealthContext || initMentalHealthContext();
      const updatedMoods = [
        ...currentContext.reportedMoods,
        {
          mood,
          intensity,
          notes,
          timestamp: new Date()
        }
      ];
      
      return await chatStore.updateMentalHealthContext(chatId, {
        reportedMoods: updatedMoods
      });
    } catch (err) {
      console.error('Error adding mood entry:', err);
      return false;
    }
  },
  
  // Add a technique to the recommended techniques list
  addRecommendedTechnique: async (
    chatId: number,
    technique: string
  ): Promise<boolean> => {
    try {
      const chat = await chatStore.getChatById(chatId);
      if (!chat) return false;
      
      const currentContext = chat.mentalHealthContext || initMentalHealthContext();
      if (currentContext.techniquesRecommended.includes(technique)) {
        return true; // Technique already recommended
      }
      
      const updatedTechniques = [...currentContext.techniquesRecommended, technique];
      
      return await chatStore.updateMentalHealthContext(chatId, {
        techniquesRecommended: updatedTechniques
      });
    } catch (err) {
      console.error('Error adding recommended technique:', err);
      return false;
    }
  },
  
  // Update or create a safety plan
  updateSafetyPlan: async (
    chatId: number,
    safetyPlan: MentalHealthContext['safetyPlan']
  ): Promise<boolean> => {
    try {
      return await chatStore.updateMentalHealthContext(chatId, { safetyPlan });
    } catch (err) {
      console.error('Error updating safety plan:', err);
      return false;
    }
  },
  
  // Delete a chat from Supabase or localStorage fallback
  deleteChat: async (id: number): Promise<boolean> => {
    // Fallback to localStorage if Supabase is not configured
    if (useLocalStorageFallback) {
      if (typeof window !== 'undefined') {
        const storedHistory = localStorage.getItem('chatHistory')
        if (storedHistory) {
          const history = JSON.parse(storedHistory)
          const updatedHistory = history.filter((c: { id: number }) => c.id !== id)
          localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
          return true
        }
      }
      return false
    }
    
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Error deleting chat:', error)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return false
    }
  },
  
  // Toggle pinned status in Supabase or localStorage fallback
  pinChat: async (id: number, currentPinned: boolean): Promise<boolean> => {
    // Fallback to localStorage if Supabase is not configured
    if (useLocalStorageFallback) {
      if (typeof window !== 'undefined') {
        const storedHistory = localStorage.getItem('chatHistory')
        if (storedHistory) {
          const history = JSON.parse(storedHistory)
          const chatIndex = history.findIndex((c: { id: number }) => c.id === id)
          if (chatIndex >= 0) {
            history[chatIndex].pinned = !currentPinned
            localStorage.setItem('chatHistory', JSON.stringify(history))
            return true
          }
        }
      }
      return false
    }
    
    try {
      const { error } = await supabase
        .from('chats')
        .update({ pinned: !currentPinned })
        .eq('id', id)
      
      if (error) {
        console.error('Error toggling pin status:', error)
        return false
      }
      
      return true
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return false
    }
  },
  
  // Generate a summarized chat title - improved for mental health content
  generateChatTitle: (messages: Message[]): string => {
    // Get first user message as title base
    const firstUserMessage = messages.find(m => m.role === 'user')
    
    if (!firstUserMessage) {
      return `Support Chat ${new Date().toLocaleString()}`
    }
    
    const content = firstUserMessage.content
    
    // Look for emotional keywords to create a more relevant title
    const emotionKeywords = [
      'anxiety', 'anxious', 'worried', 'fear', 'stress', 'overwhelm',
      'depression', 'depressed', 'sad', 'down', 'blue', 'hopeless',
      'grief', 'loss', 'trauma', 'panic', 'mood', 'feeling',
      'anger', 'angry', 'frustration', 'upset', 'emotion', 'mental'
    ]
    
    // Check if any emotion keywords are in the message
    const matchedEmotion = emotionKeywords.find(keyword => 
      content.toLowerCase().includes(keyword)
    )
    
    if (matchedEmotion) {
      // Create a more sensitive title based on the emotion
      return `Support: ${matchedEmotion.charAt(0).toUpperCase() + matchedEmotion.slice(1)} discussion`
    }
    
    // For regular messages, create a smart summary
    // Split into words and take first 4-5 meaningful words
    const words = content.split(/\s+/)
    const meaningfulWords = words.filter(word => 
      word.length > 2 && 
      !['the', 'and', 'for', 'with'].includes(word.toLowerCase())
    ).slice(0, 4)
    
    // Join words and truncate if still too long
    let summary = meaningfulWords.join(' ')
    if (summary.length > 20) {
      summary = summary.substring(0, 20) + '...'
    }
    
    return summary || `Support Chat ${new Date().toLocaleString()}`
  }
}