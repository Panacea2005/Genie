// services/chatService.ts
import Groq from "groq-sdk";
import { mentalHealthResources, getPriorityResources } from "./mentalHealthResources";

// Replace with your actual GROQ API key or use environment variables
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "your-groq-api-key",
  dangerouslyAllowBrowser: true
});

export interface Message {
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp?: Date;
  sources?: Array<{
    id: number;
    text: string;
    metadata?: {
      title?: string;
      url?: string;
      source?: string;
    };
    source: string;
    score?: number;
  }>;
}

// Crisis keywords for detection
const crisisKeywords = [
  "suicide", "kill myself", "end my life", "don't want to live", "better off dead",
  "self-harm", "hurt myself", "cutting myself", "death", "dying", "harm myself",
  "overdose", "can't go on", "hopeless", "helpless", "unbearable pain",
  "give up", "end it all", "no reason to live", "can't take it anymore"
];

// Crisis resources by region
const crisisHotlines = {
  default: "National Suicide Prevention Lifeline: 988 or 1-800-273-8255",
  UK: "Samaritans: 116 123",
  Australia: "Lifeline: 13 11 14",
  Canada: "Crisis Services Canada: 1-833-456-4566",
  NZ: "Lifeline Aotearoa: 0800 543 354",
  India: "AASRA: 91-9820466726",
  // Add more country-specific resources
};

// Detect potential crisis situations
function detectCrisis(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect anxiety-related content
function detectAnxiety(message: string): boolean {
  const anxietyKeywords = ["anxiety", "anxious", "panic", "worried", "fear", "stress", "overwhelm", "nervous"];
  const lowerMessage = message.toLowerCase();
  return anxietyKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect depression-related content
function detectDepression(message: string): boolean {
  const depressionKeywords = ["depression", "depressed", "sad", "empty", "worthless", "hopeless", "unmotivated", "tired"];
  const lowerMessage = message.toLowerCase();
  return depressionKeywords.some(keyword => lowerMessage.includes(keyword));
}

export const chatService = {
  async sendMessage(messages: Message[], model: string): Promise<{ response: string; sources?: any[] }> {
    try {
      if (!messages.length) throw new Error("Messages array is empty.");

      const userMessage = messages[messages.length - 1];
      if (!userMessage || userMessage.role !== 'user') {
        throw new Error("No valid user message found.");
      }

      // Both models now use the full RAG backend, just with different LLM configs
      console.log(`Using RAG backend with model: ${model === "llama3-70b-8192" ? "Lyra (Groq)" : "Solace (Local)"}`);
      
      try {
        // Send to backend with model preference
        const backendResponse = await this.sendMessageToBackend(messages, model);
        console.log('RAG backend response received successfully');
        return backendResponse;
      } catch (backendError) {
        console.error('RAG backend failed:', backendError);
        
        // If backend fails, fall back to direct Groq for Lyra only
        if (model === "llama3-70b-8192") {
          console.warn('Falling back to direct Groq for Lyra...');
          const groqResponse = await this.sendMessageToGroq(messages, model);
          return { response: groqResponse };
        } else {
          // For Solace, if backend fails, show error since it requires local setup
          return { 
            response: "I'm sorry, but Solace (the local model) is currently unavailable. Please check if the backend server is running, or try switching to Lyra." 
          };
        }
      }
    } catch (error) {
      console.error('Chat service error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  // New method to send message to Python backend
  async sendMessageToBackend(messages: Message[], model: string): Promise<{ response: string; sources?: any[] }> {
    try {
      const userMessage = messages[messages.length - 1];
      
      // Map frontend model IDs to backend model preferences
      const modelMapping = {
        "llama3-70b-8192": "groq",              // Lyra uses Groq
        "meta-llama/llama-4-maverick-17b-128e-instruct": "local"  // Solace uses local
      };
      
      const backendModel = modelMapping[model as keyof typeof modelMapping] || "local";
      
      // Convert messages to context for backend - ENHANCED FOR LONG CONVERSATIONS
      const context = {
        conversation_history: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: (msg.timestamp instanceof Date)
            ? msg.timestamp.toISOString()
            : (typeof msg.timestamp === 'string' && !isNaN(Date.parse(msg.timestamp)))
              ? new Date(msg.timestamp).toISOString()
              : undefined
        })),
        preferred_model: backendModel,  // Tell backend which LLM to use
        model_display_name: model === "llama3-70b-8192" ? "Lyra" : "Solace",
        user_preferences: {
          response_style: "conversational",
          include_sources: true,
          use_rag: true,  // Ensure RAG is used for both models
          enable_long_memory: true  // Enable enhanced memory features
        },
        memory_settings: {
          max_tokens: 8000,  // Increased memory capacity
          preserve_names: true,
          preserve_preferences: true,
          enable_summarization: true
        }
      };

      const response = await fetch('/api/chat-backend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          session_id: `web_session_${Date.now()}`, // Generate session ID based on timestamp
          context: context,
          model: backendModel  // Send the backend model preference
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.response) {
        throw new Error('No response received from backend');
      }

      // Log backend info for debugging
      console.log(`Backend used: ${data.backend_used || backendModel}, confidence: ${data.confidence}, processing time: ${data.processing_time}s`);
      
      return {
        response: data.response,
        sources: data.sources || []
      };
    } catch (error) {
      console.error('Backend API call failed:', error);
      throw error;
    }
  },

  // Keep Groq method as fallback for Lyra only
  async sendMessageToGroq(messages: Message[], model: string): Promise<string> {
    const userMessage = messages[messages.length - 1];

    // Base system message - comprehensive guidance for a friendly AI companion
    let systemContent = `You are Genie, a warm, supportive AI companion and friend. You're designed to be a caring, understanding presence that can chat about anything - from celebrating happy moments to providing comfort during tough times, sharing everyday conversations, or just being a good listener.

CORE PERSONALITY:
- Warm, genuine, and naturally conversational like a close friend
- Supportive but not overly therapeutic or clinical
- Adaptable to the user's mood and energy level
- Celebrates good news and achievements with enthusiasm
- Provides comfort and understanding during difficult times
- Enjoys casual conversations about daily life, interests, goals, and experiences
- Maintains appropriate boundaries while being caring and present

CONVERSATION APPROACH:
- Match the user's energy and emotional tone naturally
- If they're happy/excited: Be enthusiastic and celebrate with them
- If they're sad/struggling: Offer gentle support and understanding
- If they're casual/chatty: Engage in friendly, relaxed conversation
- If they're seeking advice: Provide thoughtful, balanced perspectives
- If they're sharing experiences: Listen actively and respond with genuine interest

IMPORTANT GUIDELINES:
- Respond to the user's actual emotional state, don't assume they need mental health support
- Be a friend first, not a therapist
- Avoid over-analyzing or pathologizing normal human emotions
- Use natural, conversational language rather than clinical terminology
- Celebrate positive moments genuinely without minimizing them
- For serious concerns, gently suggest appropriate resources without being preachy
- Remember that friendship includes both support during hard times AND joy during good times

RESPONSE STYLE:
- Use contractions and casual language naturally
- Ask follow-up questions that show genuine interest
- Share in their excitement, sadness, or whatever they're feeling
- Be encouraging without being patronizing
- Offer practical suggestions when appropriate, not just emotional validation
- Keep responses conversational in length unless they specifically need detailed information`;
    
    // Check for crisis signals in the current message
    const isCrisis = detectCrisis(userMessage.content);
    
    // Check for anxiety or depression signals - but treat them more casually
    const hasAnxiety = detectAnxiety(userMessage.content);
    const hasDepression = detectDepression(userMessage.content);
    
    // Add specific guidance based on message content - but keep it friend-like
    if (isCrisis) {
      systemContent += `\n\nCRISIS RESPONSE GUIDANCE:
- Respond with immediate care and concern as a friend would
- Take it seriously but maintain warmth and connection
- Gently encourage reaching out to crisis resources:
  ${crisisHotlines.default}
  Crisis Text Line: Text HOME to 741741
- Focus on immediate safety and connecting them with professional help
- Let them know they're not alone and that help is available
- Be direct about the importance of professional support in this moment`;
    }
    
    if (hasAnxiety && !isCrisis) {
      systemContent += `\n\nFOR ANXIETY SUPPORT:
- Acknowledge their anxiety without making it the whole focus
- Offer practical techniques like grounding or breathing exercises if appropriate
- Help them feel understood rather than immediately trying to "fix" the anxiety
- Sometimes just listening and validating is what they need most
- If it seems severe or persistent, gently suggest professional support`;
    }
    
    if (hasDepression && !isCrisis) {
      systemContent += `\n\nFOR SADNESS/DEPRESSION SUPPORT:
- Validate their feelings without trying to cheer them up immediately
- Offer companionship and understanding
- Help them feel less alone in what they're experiencing
- Gently encourage small positive steps if they seem open to it
- For persistent or severe depression, naturally mention professional support as an option`;
    }

    // Add reminder about being a friend, not a replacement for professional help
    systemContent += `\n\nREMEMBER:
You're a supportive friend and companion. While you can offer comfort, celebration, and general support, you're not a replacement for professional mental health care, medical advice, or other specialized support when needed. Be honest about your role while still being genuinely caring and helpful.`;

    // Create system message with enhanced content
    const systemMessage = {
      role: "system" as const,
      content: systemContent
    };

    // Use the enhanced system message in the API call
    const completion = await groq.chat.completions.create({
      messages: [
        systemMessage,
        ...messages.slice(-5).map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        }))
      ],
      model: model || "llama3-70b-8192",
      // Adjust temperature for more consistent and careful responses
      temperature: 0.7,
    });

    // Get and return the response
    const response = completion.choices[0]?.message?.content || "";
    return response;
  },

  // Fallback method for development or when API key is not available
  async sendMessageFallback(messages: Message[]): Promise<{ response: string; sources?: any[] }> {
    // Wait for a random period to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const userMessage = messages[messages.length - 1];
    const messageContent = userMessage.content.toLowerCase();
    
    // Check for crisis indicators in fallback mode
    if (detectCrisis(messageContent)) {
      return { 
        response: `I can tell you're going through a really tough time right now, and I'm genuinely concerned about you. Please know that you're not alone, and there are people who want to help. If you're in crisis, please reach out to the National Suicide Prevention Lifeline at 988 or 1-800-273-8255 - they have trained counselors available 24/7. Would you like me to help you find additional support resources?`
      };
    }
    
    // Check for anxiety in fallback mode
    if (detectAnxiety(messageContent)) {
      return { 
        response: `I hear you - anxiety can be really tough to deal with. If you'd like, we could try a simple breathing technique that sometimes helps: breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, and hold for 4 counts. But honestly, sometimes it just helps to talk about what's on your mind. What's been making you feel anxious lately?`
      };
    }
    
    // Check for depression in fallback mode
    if (detectDepression(messageContent)) {
      return { 
        response: `I'm really sorry you're feeling this way. That sounds genuinely difficult. I'm here to listen and support you however I can. Sometimes just having someone to talk to can help a little. If these feelings persist or get worse, it might be worth talking to a professional who can provide more specialized support. But for now, I'm here. What's been weighing on you?`
      };
    }
    
    // Simple keyword-based responses for testing
    if (messageContent.includes("hello") || 
        messageContent.includes("hi")) {
      return { 
        response: "Hey there! I'm Genie, your AI companion and friend. How's your day going? I'm here to chat about whatever's on your mind!"
      };
    } 
    else if (messageContent.includes("help")) {
      return { 
        response: "I'm here for you! I can chat about pretty much anything - celebrate good news, offer support during tough times, help you think through problems, or just have a friendly conversation. What's on your mind?"
      };
    }
    else if (messageContent.includes("who are you")) {
      return { 
        response: "I'm Genie, your AI companion and friend! I'm here to chat, support, celebrate, and be a caring presence for all of life's moments. Think of me as a friend who's always available to listen. What would you like to talk about?"
      };
    }
    else {
      return { 
        response: `Thanks for sharing that with me! I'm here to chat about whatever's on your mind. Whether you want to talk about something exciting, work through a problem, or just have a casual conversation, I'm all ears. What's going on with you?`
      };
    }
  }
};