import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages format" }, { status: 400 });
    }

    // Filter out system messages and empty content
    const validMessages = messages.filter(
      (msg: any) => msg.role === "user" || msg.role === "assistant"
    );

    if (validMessages.length === 0) {
      return NextResponse.json({ error: "No valid messages to analyze" }, { status: 400 });
    }

    // Prepare only user messages for analysis
    const userMessages = validMessages.filter((msg: any) => msg.role === "user");
    
    if (userMessages.length === 0) {
      return NextResponse.json({ error: "No user messages found" }, { status: 400 });
    }
    
    const conversationText = userMessages
      .map((msg: any) => `User: ${msg.content}`)
      .join("\n\n");
    
    console.log("User messages count:", userMessages.length);
    console.log("Conversation text length:", conversationText.length);
    console.log("First user message:", userMessages[0]?.content);

    // Create analysis prompt
    const analysisPrompt = `Below is a conversation where a user has been chatting with an AI. Analyze ONLY the user's messages (marked with "User:") to help them understand themselves better.

Focus on their communication style, emotional patterns, and personal characteristics. Provide specific insights about what you observe in their language, tone, and patterns.

Write in a warm, insightful tone that helps the user gain self-awareness. Be specific and reference what they actually said.

Here are the user's messages from the conversation:

${conversationText}

Based on these messages, provide insights about the user's communication style, emotional patterns, and personal characteristics:`;

    // Try to use the backend AI system first
    try {
      const backendResponse = await fetch(`${process.env.GENIE_BACKEND_URL || "http://127.0.0.1:8000"}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: analysisPrompt,
          session_id: `summary_${Date.now()}`,
        }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        return NextResponse.json({
          summary: backendData.response,
          success: true,
        });
      }
    } catch (backendError) {
      console.log("Backend not available, falling back to Groq");
    }

    // Fallback to Groq API
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content: "You are a compassionate conversation analyst. Analyze the specific user messages provided and give insights about their communication style, emotional patterns, and personal characteristics. Be specific and reference what they actually said. Do not give generic advice - focus on analyzing their actual messages."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!groqResponse.ok) {
      throw new Error(`Groq API error: ${groqResponse.status}`);
    }

    const groqData = await groqResponse.json();
    const analysis = groqData.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis generated");
    }

    return NextResponse.json({
      summary: analysis,
      success: true,
    });

  } catch (error) {
    console.error("Chat summary error:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate summary",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 