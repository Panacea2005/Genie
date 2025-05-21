// File: app/api/transcribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY || "",
  dangerouslyAllowBrowser: false, // Set to false for server-side
});

export async function POST(req: NextRequest) {
  console.log('Transcribe API route called');
  
  try {
    const { audio, model = "whisper-large-v3-turbo" } = await req.json();

    if (!audio) {
      console.error('No audio data provided');
      return NextResponse.json(
        { error: "No audio data provided" },
        { status: 400 }
      );
    }

    console.log('Audio data received, length:', audio.length);
    
    // FALLBACK APPROACH - If you want to test without calling Groq
    // Uncomment this code to return a mock response
    /*
    console.log('Returning mock response');
    return NextResponse.json({ 
      text: "This is a mock transcription. Replace this with the actual API call." 
    });
    */
    
    try {
      // Convert base64 to binary
      const binaryData = Buffer.from(audio, 'base64');
      
      // Create File object manually for Node.js environment
      const file = {
        buffer: binaryData,
        name: 'audio.webm',
        type: 'audio/webm',
      };
      
      console.log('Calling Groq API...');
      
      // Call Groq API to transcribe audio
      const response = await groq.audio.transcriptions.create({
        model,
        file: file as any,
        language: "en",
        response_format: "text",
      });
      
      console.log('Groq API response received:', response);
      
      if (!response || !response.text) {
        console.error('Invalid response from Groq API');
        return NextResponse.json(
          { error: "Invalid response from transcription service" },
          { status: 500 }
        );
      }
      
      // Return the transcribed text
      return NextResponse.json({ text: response.text });
      
    } catch (groqError: any) {
      console.error("Error calling Groq API:", groqError);
      
      // Return a detailed error response
      return NextResponse.json({ 
        error: "Transcription service error", 
        details: groqError.message || "Unknown error",
        fallbackText: "Voice transcription failed. Please try typing your message."
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { 
        error: "Failed to process request",
        details: error.message || "Unknown error",
        fallbackText: "Voice transcription failed. Please try typing your message." 
      },
      { status: 500 }
    );
  }
}