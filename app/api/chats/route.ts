import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    console.log('Chats API called with userId:', userId)

    if (!userId) {
      console.error('User ID is missing')
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    console.log('Fetching chats for user:', userId)

    // First, let's check if the chats table exists and is accessible
    const { data: tableCheck, error: tableError } = await supabase
      .from('chats')
      .select('count')
      .limit(1)

    if (tableError) {
      console.error('Table access error:', tableError)
      return NextResponse.json({ 
        error: 'Database table not accessible',
        details: tableError.message 
      }, { status: 500 })
    }

    console.log('Table access successful, fetching chats...')

    // Fetch chats from Supabase with detailed error handling
    const { data: chats, error, count } = await supabase
      .from('chats')
      .select('id, title, date, messages, user_id, created_at, updated_at, pinned, mental_health_context', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching chats:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch chats',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log(`Successfully fetched ${chats?.length || 0} chats for user ${userId}`)

    // Log the first chat for debugging (without sensitive data)
    if (chats && chats.length > 0) {
      console.log('Sample chat structure:', {
        id: chats[0].id,
        title: chats[0].title,
        date: chats[0].date,
        messageCount: chats[0].messages?.length || 0,
        userId: chats[0].user_id
      })
    }

    return NextResponse.json({
      chats: chats || [],
      count: chats?.length || 0,
      success: true
    })

  } catch (error) {
    console.error('Unexpected error in chats API:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch chats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 