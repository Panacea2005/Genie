import { NextRequest, NextResponse } from 'next/server';

// Configuration for the Python backend
const BACKEND_URL = process.env.GENIE_BACKEND_URL || 'http://127.0.0.1:8000';

interface TestCase {
  name: string;
  message: string;
  type: string;
}

interface TestResultRow {
  testCase: string;
  groq_confidence: number | string;
  local_confidence: number | string;
  groq_time: number | string;
  local_time: number | string;
  groq_total: number | string;
  local_total: number | string;
}

async function callBackend(message: string, model: string): Promise<any> {
  const startTime = Date.now();
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        model,
        session_id: `test_${Date.now()}_${Math.random()}`
      }),
      signal: AbortSignal.timeout(120000), // 2 min timeout
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend error for ${model}:`, errorText);
      return { 
        error: true, 
        confidence: '-', 
        processing_time: '-', 
        total_score: '-',
        response: 'Error: Backend unavailable'
      };
    }
    
    const data = await res.json();
    const endTime = Date.now();
    const clientTime = (endTime - startTime) / 1000; // Convert to seconds
    
    // Calculate a simple score based on response quality
    let totalScore = 0;
    if (data.response && typeof data.response === 'string') {
      const response = data.response;
      // Score based on response length (not too short, not too long)
      if (response.length > 50 && response.length < 2000) totalScore += 30;
      // Score based on confidence
      if (data.confidence && typeof data.confidence === 'number') {
        totalScore += data.confidence * 40;
      }
      // Score based on response time (faster is better, but not too fast)
      if (data.processing_time && typeof data.processing_time === 'number') {
        if (data.processing_time < 5) totalScore += 20;
        else if (data.processing_time < 15) totalScore += 10;
        else if (data.processing_time < 30) totalScore += 5;
      }
      // Bonus for having sources
      if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
        totalScore += 10;
      }
    }
    
    return {
      ...data,
      processing_time: data.processing_time || clientTime,
      total_score: Math.round(totalScore),
      client_time: clientTime
    };
  } catch (error) {
    console.error(`Error calling backend for ${model}:`, error);
    return { 
      error: true, 
      confidence: '-', 
      processing_time: '-', 
      total_score: '-',
      response: 'Error: Connection failed'
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { test_cases } = await req.json();
    if (!Array.isArray(test_cases)) {
      return NextResponse.json({ error: 'test_cases must be an array' }, { status: 400 });
    }
    
    const results: TestResultRow[] = [];
    
    for (const testCase of test_cases) {
      const { name, message } = testCase;
      console.log(`Testing case: ${name}`);
      
      // Call Groq model
      let groqRes;
      try {
        console.log(`Calling Groq for: ${name}`);
        groqRes = await callBackend(message, 'groq');
        console.log(`Groq result for ${name}:`, {
          confidence: groqRes.confidence,
          processing_time: groqRes.processing_time,
          total_score: groqRes.total_score,
          error: groqRes.error
        });
      } catch (e) {
        console.error(`Groq error for ${name}:`, e);
        groqRes = { 
          error: true, 
          confidence: '-', 
          processing_time: '-', 
          total_score: '-',
          response: 'Error: Groq failed'
        };
      }
      
      // Call Local model
      let localRes;
      try {
        console.log(`Calling Local for: ${name}`);
        localRes = await callBackend(message, 'local');
        console.log(`Local result for ${name}:`, {
          confidence: localRes.confidence,
          processing_time: localRes.processing_time,
          total_score: localRes.total_score,
          error: localRes.error
        });
      } catch (e) {
        console.error(`Local error for ${name}:`, e);
        localRes = { 
          error: true, 
          confidence: '-', 
          processing_time: '-', 
          total_score: '-',
          response: 'Error: Local failed'
        };
      }
      
      results.push({
        testCase: name,
        groq_confidence: groqRes.error ? '-' : (groqRes.confidence || '-'),
        local_confidence: localRes.error ? '-' : (localRes.confidence || '-'),
        groq_time: groqRes.error ? '-' : (groqRes.processing_time || '-'),
        local_time: localRes.error ? '-' : (localRes.processing_time || '-'),
        groq_total: groqRes.error ? '-' : (groqRes.total_score || '-'),
        local_total: localRes.error ? '-' : (localRes.total_score || '-'),
      });
    }
    
    console.log('Final results:', results);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Model test error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
} 