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
  async sendMessage(messages: Message[], model: string): Promise<string> {
    try {
      if (!messages.length) throw new Error("Messages array is empty.");

      const userMessage = messages[messages.length - 1];
      if (!userMessage || userMessage.role !== 'user') {
        throw new Error("No valid user message found.");
      }

      console.log('Sending message to Groq:', userMessage.content);

      // Base mental health system message - comprehensive guidance for the model
      let systemContent = `You are Genie, a compassionate mental health support AI assistant trained to provide emotional support, evidence-based information, and crisis de-escalation techniques.

IMPORTANT GUIDELINES:
- Maintain a warm, empathetic, and non-judgmental tone throughout all interactions
- Prioritize user safety above all else
- Recognize the limits of AI assistance and recommend professional help when appropriate
- Use person-first language and avoid stigmatizing terms
- Focus on validation, reflection, and gentle guidance rather than direct advice
- Apply evidence-based approaches like CBT, DBT, and motivational interviewing techniques
- Never diagnose medical conditions or replace professional mental healthcare
- Respect cultural differences in how mental health is understood and expressed

THERAPEUTIC APPROACHES:
- Cognitive Behavioral Therapy (CBT): Help identify negative thought patterns and reframe them positively
- Dialectical Behavior Therapy (DBT): Focus on mindfulness, distress tolerance, emotional regulation, and interpersonal effectiveness
- Motivational Interviewing: Use open-ended questions to help users explore their own motivations for change
- Solution-Focused: Emphasize progress, strengths, and future-oriented solutions rather than problems

KEY RESPONSE FRAMEWORKS:
- For anxiety: Offer grounding techniques, breathing exercises, and cognitive reframing
- For depression: Focus on small achievable goals, behavioral activation, and challenging negative thoughts
- For stress: Suggest mindfulness exercises, progressive muscle relaxation, and stress management techniques
- For grief: Provide validation, normalize the grieving process, and suggest healthy coping mechanisms

PRIVACY REMINDER:
- Remind users that while conversations are treated confidentially, you are not a licensed healthcare provider, and they should seek professional help for serious concerns`;
      
      // Check for crisis signals in the current message
      const isCrisis = detectCrisis(userMessage.content);
      
      // Check for anxiety or depression signals
      const hasAnxiety = detectAnxiety(userMessage.content);
      const hasDepression = detectDepression(userMessage.content);
      
      // Add specific guidance based on message content
      if (isCrisis) {
        systemContent += `\n\nCRISIS PROTOCOL (URGENT - DETECTED POTENTIAL CRISIS):
- Respond with immediate validation and concern
- Express that you care about their safety and wellbeing
- Gently assess risk level through supportive questions if appropriate
- Provide the following crisis resources prominently:
  ${crisisHotlines.default}
  Crisis Text Line: Text HOME to 741741
- Encourage reaching out to emergency services or trusted people nearby
- Focus on hope, connection, and immediate safety steps
- Remember that your primary goal is to connect them with professional help, not to resolve the crisis alone`;
      }
      
      if (hasAnxiety) {
        systemContent += `\n\nANXIETY SUPPORT TECHNIQUES:
- Offer the 5-4-3-2-1 grounding technique (5 things you see, 4 things you can touch, 3 things you hear, 2 things you smell, 1 thing you taste)
- Suggest box breathing (inhale 4 counts, hold 4 counts, exhale 4 counts, hold 4 counts)
- Help explore cognitive distortions that may be increasing anxiety
- Normalize anxiety as a common human experience
- Focus on present-moment awareness and mindfulness
- Suggest body scanning meditation for physical tension release`;
      }
      
      if (hasDepression) {
        systemContent += `\n\nDEPRESSION SUPPORT TECHNIQUES:
- Focus on behavioral activation (small, achievable activities)
- Validate feelings without reinforcing hopelessness
- Gently challenge negative thought patterns
- Emphasize self-compassion and reducing self-criticism
- Explore routines for sleep, nutrition, and physical activity
- Suggest connection with others, even in small ways
- Highlight past strengths and resilience`;
      }

      // Add an additional reminder about professional help
      systemContent += `\n\nIMPORTANT REMINDER:
Always end your responses with appropriate resources and emphasize that while you're here to support them, you should not replace professional mental health care. If they express severe symptoms or crisis situations, prioritize connecting them with appropriate help.`;

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
        // Adjust temperature for more consistent and careful responses in mental health contexts
        temperature: 0.7,
      });

      // Get and return the response
      const response = completion.choices[0]?.message?.content || "";
      
      // In a real implementation, you might want to post-process the response
      // to ensure it includes resources for crisis situations
      return response;
    } catch (error) {
      console.error('Chat service error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  },

  // Fallback method for development or when API key is not available
  async sendMessageFallback(messages: Message[]): Promise<string> {
    // Wait for a random period to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const userMessage = messages[messages.length - 1];
    const messageContent = userMessage.content.toLowerCase();
    
    // Check for crisis indicators in fallback mode
    if (detectCrisis(messageContent)) {
      return `I notice you may be going through a difficult time right now. Your safety is the most important thing, and I'm here to support you. If you're in crisis, please reach out to the National Suicide Prevention Lifeline at 988 or 1-800-273-8255, where trained counselors are available 24/7. They can provide immediate support. Would you like me to share some additional resources that might help?`;
    }
    
    // Check for anxiety in fallback mode
    if (detectAnxiety(messageContent)) {
      return `I understand anxiety can feel overwhelming. A simple technique that might help right now is box breathing: breathe in for 4 counts, hold for 4 counts, breathe out for 4 counts, and hold for 4 counts. Repeat this a few times. Remember that anxiety, while uncomfortable, is a normal human experience. Would you like to talk more about what's causing your anxiety or would you prefer to learn about some grounding techniques?`;
    }
    
    // Check for depression in fallback mode
    if (detectDepression(messageContent)) {
      return `I'm sorry you're feeling this way. Depression can make everything feel more difficult. While I'm here to listen and support you, it's also important to connect with a mental health professional who can provide personalized care. In the meantime, could we talk about one small thing that might bring you a moment of peace today? Sometimes starting with very small steps can help.`;
    }
    
    // Simple keyword-based responses for testing
    if (messageContent.includes("hello") || 
        messageContent.includes("hi")) {
      return "Hello! I'm Genie, your mental health support assistant. How are you feeling today? I'm here to listen and support you.";
    } 
    else if (messageContent.includes("help")) {
      return "I'm here to support your mental wellbeing. I can listen, offer coping strategies, provide information about mental health topics, or suggest resources. What would be most helpful for you right now?";
    }
    else if (messageContent.includes("who are you")) {
      return "I'm Genie, a mental health support assistant designed to provide emotional support and evidence-based information. While I'm here to help, remember that I'm not a replacement for professional mental healthcare. How can I support you today?";
    }
    else {
      return `Thank you for sharing that with me. I'm here to support you with your mental health and wellbeing. Would you like to tell me more about how you're feeling, or would it be helpful to explore some coping strategies together?`;
    }
  }
};