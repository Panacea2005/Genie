import { createClient } from '@supabase/supabase-js'

// Types
export type Message = {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: Date
  tokens?: number
  speed?: string
}

// New Mental Health Context tracking
export interface MoodEntry {
  mood: string
  intensity: number // 1-10 scale
  timestamp: Date
  notes?: string
}

export interface EmotionDetection {
  emotion: string
  confidence: number
  mental_health_category: string
  timestamp: Date
  source: 'voice' | 'text' | 'facial' // Future expansion
}

export interface MentalHealthContext {
  reportedMoods: MoodEntry[]
  detectedEmotions: EmotionDetection[]  // New: Track AI-detected emotions
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
    detectedEmotions: [],  // New: Initialize detected emotions array
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
  user_id: string // This will be a UUID string
  mentalHealthContext?: MentalHealthContext
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const chatStore = {
  // Get chat history from Supabase
  getChatHistory: async (userId: string): Promise<ChatHistory[]> => {
    if (!userId) {
      console.error('No user ID provided')
      return []
    }
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Error fetching chat history:', error)
        return []
      }
      
      // Initialize mental health context if it doesn't exist
      return data?.map(chat => ({
        ...chat,
        mentalHealthContext: chat.mental_health_context || initMentalHealthContext()
      })) || []
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return []
    }
  },
  
  // Get a specific chat by ID
  getChatById: async (chatId: number): Promise<ChatHistory | null> => {
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
        mentalHealthContext: data.mental_health_context || initMentalHealthContext()
      } : null
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return null
    }
  },
  
  // Save a new chat to Supabase
  saveChat: async (chat: ChatHistory): Promise<ChatHistory | null> => {
    if (!chat.user_id) {
      console.error('No user ID provided for new chat')
      return null
    }
    
    // Initialize mental health context if it doesn't exist
    if (!chat.mentalHealthContext) {
      chat.mentalHealthContext = initMentalHealthContext()
    }
    
    try {
      // Log what we're trying to insert for debugging
      const insertData = {
        title: chat.title,
        date: chat.date,
        messages: chat.messages,
        user_id: chat.user_id,
        pinned: chat.pinned || false,
        mental_health_context: chat.mentalHealthContext
      }
      
      console.log('Attempting to insert chat with data:', {
        ...insertData,
        messages: `${insertData.messages.length} messages`,
        user_id: insertData.user_id
      })
      
      const { data, error } = await supabase
        .from('chats')
        .insert([insertData])
        .select()
      
      if (error) {
        console.error('Error saving chat:', error)
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        return null
      }
      
      console.log('Chat saved successfully:', data?.[0])
      return data?.[0] || null
    } catch (err) {
      console.error('Error accessing Supabase:', err)
      return null
    }
  },
  
  // Update an existing chat in Supabase
  updateChat: async (id: number, updates: Partial<ChatHistory>): Promise<boolean> => {
    try {
      // Prepare the update object with the correct column names
      const updateObject: any = {}
      
      if (updates.title !== undefined) updateObject.title = updates.title
      if (updates.date !== undefined) updateObject.date = updates.date
      if (updates.messages !== undefined) updateObject.messages = updates.messages
      if (updates.pinned !== undefined) updateObject.pinned = updates.pinned
      if (updates.mentalHealthContext !== undefined) {
        updateObject.mental_health_context = updates.mentalHealthContext
      }
      
      const { error } = await supabase
        .from('chats')
        .update(updateObject)
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
  
  // Add detected emotion to the mental health context
  addDetectedEmotion: async (
    chatId: number,
    emotion: string,
    confidence: number,
    mental_health_category: string,
    source: 'voice' | 'text' | 'facial' = 'voice'
  ): Promise<boolean> => {
    try {
      const chat = await chatStore.getChatById(chatId);
      if (!chat) return false;
      
      const currentContext = chat.mentalHealthContext || initMentalHealthContext();
      const updatedEmotions = [
        ...currentContext.detectedEmotions,
        {
          emotion,
          confidence,
          mental_health_category,
          timestamp: new Date(),
          source
        }
      ];
      
      // Keep only last 20 emotion detections to prevent unlimited growth
      const trimmedEmotions = updatedEmotions.slice(-20);
      
      return await chatStore.updateMentalHealthContext(chatId, {
        detectedEmotions: trimmedEmotions
      });
    } catch (err) {
      console.error('Error adding detected emotion:', err);
      return false;
    }
  },

  // Get emotion patterns for analysis
  getEmotionPatterns: async (chatId: number): Promise<{
    recentEmotions: EmotionDetection[];
    dominantEmotion: string | null;
    riskIndicators: string[];
  }> => {
    try {
      const chat = await chatStore.getChatById(chatId);
      if (!chat || !chat.mentalHealthContext) {
        return { recentEmotions: [], dominantEmotion: null, riskIndicators: [] };
      }
      
      const recentEmotions = chat.mentalHealthContext.detectedEmotions.slice(-10);
      
      // Find most common emotion in recent detections
      const emotionCounts: { [emotion: string]: number } = {};
      recentEmotions.forEach(detection => {
        emotionCounts[detection.emotion] = (emotionCounts[detection.emotion] || 0) + 1;
      });
      
      const emotionKeys = Object.keys(emotionCounts);
      const dominantEmotion = emotionKeys.length > 0 
        ? emotionKeys.reduce((a, b) => emotionCounts[a] > emotionCounts[b] ? a : b)
        : null;
      
      // Identify risk indicators
      const riskIndicators: string[] = [];
      const riskCategories = ['depression_risk', 'anxiety_risk', 'stress_response'];
      const recentRiskEmotions = recentEmotions.filter(detection => 
        riskCategories.includes(detection.mental_health_category)
      );
      
      if (recentRiskEmotions.length >= 3) {
        riskIndicators.push('Multiple risk emotions detected');
      }
      
      const highConfidenceRisk = recentRiskEmotions.filter(detection => 
        detection.confidence > 0.7
      );
      if (highConfidenceRisk.length >= 2) {
        riskIndicators.push('High confidence risk emotions detected');
      }
      
      return { recentEmotions, dominantEmotion, riskIndicators };
    } catch (err) {
      console.error('Error analyzing emotion patterns:', err);
      return { recentEmotions: [], dominantEmotion: null, riskIndicators: [] };
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
  
  // Delete a chat from Supabase
  deleteChat: async (id: number): Promise<boolean> => {
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
  
  // Toggle pinned status in Supabase
  pinChat: async (id: number, currentPinned: boolean): Promise<boolean> => {
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