import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, sessionId, messages } = body;

    // Validate required fields
    if (!message && !messages) {
      return NextResponse.json(
        { error: 'Message or messages required' }, 
        { status: 400 }
      );
    }

    // Prepare messages for Groq API
    const apiMessages = messages || [
      {
        role: 'system',
        content: 'You are Genie AI, an empathetic mental health support companion. Provide helpful, supportive responses while maintaining professional boundaries. Always be compassionate and understanding.'
      },
      {
        role: 'user',
        content: message
      }
    ];

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', response.status, errorData);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Return formatted response
    return NextResponse.json({
      response: data.choices[0].message.content,
      confidence: 0.85,
      processing_time: 1.2,
      citations: [],
      sessionId: sessionId || 'default'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal Server Error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
