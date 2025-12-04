import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabaseUrl = 'https://zhmjhqiikqmqmuaagnti.supabase.co'
  const supabaseKey = 'sb_publishable_CzAjd4L2V4z0f32fHVEZIw_stIkj2e2'

  const results: any = {
    url: supabaseUrl,
    keyPrefix: supabaseKey.substring(0, 30) + '...',
    tests: [],
    summary: '',
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test 1: Connection and table access
    const { data, error } = await supabase
      .from('searches')
      .select('id')
      .limit(1)

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        results.tests.push({
          name: 'Table Access',
          status: 'warning',
          message: 'Tables do not exist - need to run schema.sql',
        })
        results.summary = 'Connection works, but tables need to be created'
      } else if (error.message.includes('JWT') || error.message.includes('Invalid API key')) {
        results.tests.push({
          name: 'Authentication',
          status: 'error',
          message: 'Invalid API key: ' + error.message,
        })
        results.summary = 'Connection failed - check API key'
      } else {
        results.tests.push({
          name: 'Connection',
          status: 'error',
          message: error.message,
          code: error.code,
        })
        results.summary = 'Connection error'
      }
    } else {
      results.tests.push({
        name: 'Connection & Tables',
        status: 'success',
        message: 'Connection successful and tables exist',
      })
    }

    // Test 2: Write access (if tables exist)
    if (!error || error.code !== 'PGRST116') {
      const { data: insertData, error: insertError } = await supabase
        .from('searches')
        .insert({
          query: 'connection_test_' + Date.now(),
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (insertError) {
        results.tests.push({
          name: 'Write Access',
          status: 'error',
          message: insertError.message,
        })
      } else {
        results.tests.push({
          name: 'Write Access',
          status: 'success',
          message: 'Write access working',
          testRecordId: insertData.id,
        })

        // Clean up test record
        await supabase.from('searches').delete().eq('id', insertData.id)
      }
    }

    // Final summary
    if (results.summary === '') {
      const allSuccess = results.tests.every((t: any) => t.status === 'success')
      results.summary = allSuccess
        ? '✅ All tests passed - Database is ready!'
        : '⚠️ Some tests failed - Check details above'
    }

    return NextResponse.json(results, { status: 200 })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Test failed',
        message: err.message,
        stack: err.stack,
        summary: '❌ Connection test failed',
      },
      { status: 500 }
    )
  }
}

