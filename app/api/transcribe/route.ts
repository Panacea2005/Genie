import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json({ 
        error: 'No audio file provided' 
      }, { status: 400 });
    }

    // Validate file type
    if (!audioFile.type.startsWith('audio/')) {
      return NextResponse.json({ 
        error: 'File must be an audio file' 
      }, { status: 400 });
    }

    // Create new FormData for Groq API
    const groqFormData = new FormData();
    groqFormData.append('file', audioFile);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', 'en');

    // Call Groq API for transcription
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Transcription API error:', response.status, errorData);
      throw new Error(`Transcription API error: ${response.status}`);
    }

    const data = await response.json();
    
    return NextResponse.json({
      text: data.text,
      confidence: 0.9,
      language: 'en',
      duration: audioFile.size / 16000 // Rough estimate
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}