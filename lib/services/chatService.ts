// services/chatService.ts
import Groq from "groq-sdk";

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

export const chatService = {
  async sendMessage(messages: Message[], model: string): Promise<string> {
    try {
      if (!messages.length) throw new Error("Messages array is empty.");

      const userMessage = messages[messages.length - 1];
      if (!userMessage || userMessage.role !== 'user') {
        throw new Error("No valid user message found.");
      }

      console.log('Sending message to Groq:', userMessage.content);

      // Define system message - customize as needed for your Genie AI assistant
      const systemMessage = {
        role: "system" as const,
        content: `You are Genie, an advanced AI assistant created to help users with a wide range of tasks. Your tone is friendly, helpful, and conversational. Provide detailed and accurate information while maintaining a supportive demeanor. When you don't know something, be honest about it.`
      };

      // Use the Groq API to get a response
      const completion = await groq.chat.completions.create({
        messages: [
          systemMessage,
          ...messages.slice(-5).map(msg => ({
            role: msg.role as "system" | "user" | "assistant",
            content: msg.content
          }))
        ],
        model: model || "llama3-70b-8192",
      });

      return completion.choices[0]?.message?.content || "";
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
    
    // Simple keyword-based responses for testing
    if (userMessage.content.toLowerCase().includes("hello") || 
        userMessage.content.toLowerCase().includes("hi")) {
      return "Hello! I'm Genie, your AI assistant. How can I help you today?";
    } 
    else if (userMessage.content.toLowerCase().includes("weather")) {
      return "I don't have access to real-time weather data, but I can suggest checking a weather app or website for the most accurate forecast.";
    }
    else if (userMessage.content.toLowerCase().includes("help")) {
      return "I can help you with information, answer questions, write content, and more. Just ask away!";
    }
    else if (userMessage.content.toLowerCase().includes("who are you")) {
      return "I'm Genie, an AI assistant designed to be helpful, harmless, and honest. I can answer questions, assist with tasks, provide information, and engage in conversation.";
    }
    else {
      return `I've received your message: "${userMessage.content}". This is a simulated response for development purposes. In production, this would connect to the Groq API or another language model service.`;
    }
  }
};