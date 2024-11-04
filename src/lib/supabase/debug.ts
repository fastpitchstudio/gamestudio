// lib/supabase/debug.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../types/database-types'
import { Session, User } from '@supabase/supabase-js'

export async function debugPolicies() {
  const supabase = createClientComponentClient<Database>()
  const results: Record<string, unknown> = {}

  try {
    // 1. Get auth status with token info
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const { data: { session } } = await supabase.auth.getSession()
    
    results.auth = { 
      user: user?.id,
      email: user?.email,
      sessionInfo: {
        accessToken: session?.access_token ? 'present' : 'missing',
        expiresAt: session?.expires_at,
        tokenDetails: session?.access_token ? {
          length: session.access_token.length,
          prefix: session.access_token.substring(0, 10) + '...'
        } : null
      },
      metadata: user?.app_metadata,
      error: authError,
      timestamp: new Date().toISOString()
    }

    if (!user) {
      return { ...results, error: 'No authenticated user found' }
    }

    // 2. Test simple insert first
    const testTeam = {
      name: `Debug Team ${new Date().toISOString()}`
    }

    console.log('Testing insert with auth:', {
      userId: user.id,
      hasSession: !!session,
      hasAccessToken: !!session?.access_token
    })

    const { data: insertData, error: insertError } = await supabase
      .from('teams')
      .insert(testTeam)
      .select()

    results.insertTest = {
      success: !insertError,
      error: insertError ? {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      } : null,
      data: insertData
    }

    // 3. Test auth status again after operation
    const { data: { session: finalSession } } = await supabase.auth.getSession()
    
    results.finalCheck = {
      hasValidSession: !!finalSession,
      tokenPresent: !!finalSession?.access_token,
      timestamp: new Date().toISOString()
    }

    return results
  } catch (error) {
    console.error('Debug error:', error)
    return { 
      ...results, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorTimestamp: new Date().toISOString()
    }
  }
}
