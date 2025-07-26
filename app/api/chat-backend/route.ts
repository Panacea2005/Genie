import { NextRequest, NextResponse } from 'next/server';

// Configuration for the Python backend
const BACKEND_URL = process.env.GENIE_BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  console.log('Chat backend API route called');
  
  try {
    const body = await req.json();
    const { message, session_id = 'default', context, model } = body;

    if (!message || !message.trim()) {
      console.error('No message provided');
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    console.log(`Forwarding request to Python backend: ${BACKEND_URL}/chat`);
    console.log('Message:', message.substring(0, 100) + '...');

    // Forward the request to the Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id,
        context,
        model
      }),
      // Add timeout to prevent hanging
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(`Backend API error: ${backendResponse.status} ${backendResponse.statusText}`, errorText);
      
      // Return a user-friendly error message
      return NextResponse.json({
        error: "Backend service unavailable",
        details: `Python backend returned ${backendResponse.status}`,
        fallback: true
      }, { status: 503 });
    }

    const responseData = await backendResponse.json();
    console.log('Backend response received, confidence:', responseData.confidence);

    // Return the response from the Python backend
    return NextResponse.json({
      response: responseData.response,
      confidence: responseData.confidence,
      sources: responseData.sources,
      session_id: responseData.session_id,
      processing_time: responseData.processing_time,
      model_used: responseData.model_used,
      backend_used: 'genie-rag'
    });

  } catch (error: any) {
    console.error("Error connecting to Python backend:", error);
    
    // Check if it's a timeout or connection error
    const isConnectionError = error.name === 'AbortError' || 
                             error.code === 'ECONNREFUSED' ||
                             error.message.includes('fetch');

    return NextResponse.json({
      error: "Backend connection failed",
      details: error.message || "Unknown error",
      fallback: true,
      connection_error: isConnectionError
    }, { status: 503 });
  }
}

// Health check endpoint
export async function GET(req: NextRequest) {
  try {
    const healthResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout for health check
    });

    if (!healthResponse.ok) {
      return NextResponse.json({
        status: 'unhealthy',
        backend_url: BACKEND_URL,
        error: `Backend returned ${healthResponse.status}`
      }, { status: 503 });
    }

    const healthData = await healthResponse.json();
    
    return NextResponse.json({
      status: 'healthy',
      backend_url: BACKEND_URL,
      backend_status: healthData
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'unhealthy',
      backend_url: BACKEND_URL,
      error: error.message || "Connection failed"
    }, { status: 503 });
  }
} 