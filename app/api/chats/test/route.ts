import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Check environment variables
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing Supabase environment variables',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('chats')
      .select('count')
      .limit(1)

    if (connectionError) {
      return NextResponse.json({
        error: 'Failed to connect to Supabase',
        details: connectionError.message,
        code: connectionError.code
      }, { status: 500 })
    }

    // Test table structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('chats')
      .select('*')
      .limit(1)

    if (sampleError) {
      return NextResponse.json({
        error: 'Failed to fetch sample data',
        details: sampleError.message,
        code: sampleError.code
      }, { status: 500 })
    }

    // Get table info
    const tableInfo = {
      hasData: sampleData && sampleData.length > 0,
      sampleFields: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
      totalRows: connectionTest?.length || 0
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      tableInfo,
      environment: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlLength: supabaseUrl?.length || 0,
        keyLength: supabaseKey?.length || 0
      }
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      error: 'Unexpected error in test endpoint',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 