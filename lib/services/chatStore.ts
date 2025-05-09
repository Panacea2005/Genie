import { createClient } from '@supabase/supabase-js'

// Types
export type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
}

export type ChatHistory = {
  id: number
  title: string
  date: string
  messages: Message[]
  pinned?: boolean
  user_id: string // Changed to snake_case to match Supabase table
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
      
      return data || []
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return []
    }
  },
  
  // Save a new chat to Supabase or localStorage fallback
  saveChat: async (chat: ChatHistory): Promise<ChatHistory | null> => {
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
  
  // Generate a summarized chat title
  generateChatTitle: (messages: Message[]): string => {
    // Get first user message as title base
    const firstUserMessage = messages.find(m => m.role === 'user')
    
    if (!firstUserMessage) {
      return `Chat ${new Date().toLocaleString()}`
    }
    
    const content = firstUserMessage.content
    
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
    
    return summary || `Chat ${new Date().toLocaleString()}`
  }
}