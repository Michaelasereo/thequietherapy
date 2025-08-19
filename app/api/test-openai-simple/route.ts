import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function GET() {
  try {
    console.log('Testing OpenAI connection...')
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length)
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not found in environment variables'
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    console.log('OpenAI client created successfully')

    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: 'Say "Hello, OpenAI is working!"'
        }
      ],
      max_tokens: 50
    })

    console.log('OpenAI API call successful')

    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working!',
      response: completion.choices[0].message.content,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({
      success: false,
      error: 'OpenAI API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
