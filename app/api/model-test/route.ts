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
  lyra_confidence: number | string;
  solace_confidence: number | string;
  lyra_time: number | string;
  solace_time: number | string;
  lyra_total: number | string;
  solace_total: number | string;
}

// Enhanced scoring algorithm with source relevance focus
function calculateComprehensiveScore(
  confidence: number,
  responseTime: number,
  sourceRelevance: number,
  responseLength: number
): number {
  // Normalize confidence (0-1 to 0-100)
  const confidenceScore = confidence * 100;
  
  // Normalize response time (faster = higher score, with diminishing returns)
  // Optimal time: 1-3 seconds, penalty for too fast (<0.5s) or too slow (>10s)
  let timeScore = 100;
  if (responseTime < 0.5) {
    timeScore = 60 + (responseTime * 80); // Too fast = lower quality
  } else if (responseTime <= 3) {
    timeScore = 100 - ((responseTime - 0.5) * 10); // Optimal range
  } else if (responseTime <= 10) {
    timeScore = 75 - ((responseTime - 3) * 5); // Acceptable range
  } else {
    timeScore = Math.max(20, 25 - ((responseTime - 10) * 2)); // Slow penalty
  }
  
  // Source relevance score (0-100)
  // Higher relevance = better score
  const relevanceScore = sourceRelevance * 100;
  
  // Weighted combination (scientific approach)
  // Confidence: 40% (most important for accuracy)
  // Time: 30% (important for user experience)
  // Source Relevance: 30% (reliability and quality of sources)
  
  const finalScore = (
    (confidenceScore * 0.4) +
    (timeScore * 0.3) +
    (relevanceScore * 0.3)
  );
  
  return Math.round(finalScore);
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
    
    // Use the actual processing time from backend if available, otherwise use client time
    const actualTime = data.processing_time || clientTime;
    
    // Calculate comprehensive score using the enhanced algorithm
    let totalScore = 0;
    if (data.response && typeof data.response === 'string') {
      const response = data.response;
      const confidence = data.confidence || 0;
      
      // Calculate source relevance based on number and quality of sources
      let sourceRelevance = 0.5; // Default relevance
      if (data.sources && Array.isArray(data.sources) && data.sources.length > 0) {
        // Higher relevance for more sources, but with diminishing returns
        sourceRelevance = Math.min(1.0, 0.5 + (data.sources.length * 0.1));
        
        // Additional relevance based on source quality indicators
        if (data.sources.some((source: any) => source.title && source.url)) {
          sourceRelevance += 0.2;
        }
        if (data.sources.some((source: any) => source.snippet && source.snippet.length > 50)) {
          sourceRelevance += 0.1;
        }
        sourceRelevance = Math.min(1.0, sourceRelevance);
      }
      
      totalScore = calculateComprehensiveScore(
        confidence,
        actualTime,
        sourceRelevance,
        response.length
      );
    }
    
    return {
      ...data,
      processing_time: actualTime,
      total_score: totalScore,
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
    
    // Validate test case format
    for (let i = 0; i < test_cases.length; i++) {
      const testCase = test_cases[i];
      if (!testCase.name || !testCase.message) {
        return NextResponse.json({ 
          error: `Test case ${i + 1} must have 'name' and 'message' fields` 
        }, { status: 400 });
      }
      if (typeof testCase.name !== 'string' || typeof testCase.message !== 'string') {
        return NextResponse.json({ 
          error: `Test case ${i + 1}: 'name' and 'message' must be strings` 
        }, { status: 400 });
      }
    }
    
    console.log(`Starting model comparison test with ${test_cases.length} test cases`);
    const results: TestResultRow[] = [];
    
    for (const testCase of test_cases) {
      const { name, message } = testCase;
      console.log(`Testing case: ${name}`);
      
      // Call Lyra (Groq Llama-3.3) model
      let lyraRes;
      try {
        console.log(`Calling Lyra (Groq Llama-3.3) for: ${name}`);
        lyraRes = await callBackend(message, 'groq');
        console.log(`Lyra result for ${name}:`, {
          confidence: lyraRes.confidence,
          processing_time: lyraRes.processing_time,
          total_score: lyraRes.total_score,
          error: lyraRes.error
        });
      } catch (e) {
        console.error(`Lyra error for ${name}:`, e);
        lyraRes = { 
          error: true, 
          confidence: '-', 
          processing_time: '-', 
          total_score: '-',
          response: 'Error: Lyra failed'
        };
      }
      
      // Call Solace (Groq Llama-4) model
      let solaceRes;
      try {
        console.log(`Calling Solace (Groq Llama-4) for: ${name}`);
        solaceRes = await callBackend(message, 'local'); // Backend maps 'local' to Groq Llama-4
        console.log(`Solace result for ${name}:`, {
          confidence: solaceRes.confidence,
          processing_time: solaceRes.processing_time,
          total_score: solaceRes.total_score,
          error: solaceRes.error
        });
      } catch (e) {
        console.error(`Solace error for ${name}:`, e);
        solaceRes = { 
          error: true, 
          confidence: '-', 
          processing_time: '-', 
          total_score: '-',
          response: 'Error: Solace failed'
        };
      }
      
      results.push({
        testCase: name,
        lyra_confidence: lyraRes.error ? '-' : (lyraRes.confidence || '-'),
        solace_confidence: solaceRes.error ? '-' : (solaceRes.confidence || '-'),
        lyra_time: lyraRes.error ? '-' : (lyraRes.processing_time || '-'),
        solace_time: solaceRes.error ? '-' : (solaceRes.processing_time || '-'),
        lyra_total: lyraRes.error ? '-' : (lyraRes.total_score || '-'),
        solace_total: solaceRes.error ? '-' : (solaceRes.total_score || '-'),
      });
    }
    
    console.log('Final results:', results);
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Model test error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
} 