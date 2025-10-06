import { NextRequest, NextResponse } from 'next/server'
import { getDeepSeekClient } from '@/lib/ai/deepseek-service'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ 
        error: 'Message is required' 
      }, { status: 400 })
    }

    console.log('🧪 Testing DeepSeek direct API with message:', message.substring(0, 100))

    // Get DeepSeek client
    const client = getDeepSeekClient()

    // Make direct API call
    const startTime = Date.now()
    const response = await client.chatCompletionsCreate({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant. Respond briefly and professionally to test messages."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150,
      temperature: 0.7,
      stream: false,
    })

    const duration = Date.now() - startTime
    const aiResponse = response.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('Empty response from DeepSeek API')
    }

    console.log('✅ DeepSeek direct API test successful')

    return NextResponse.json({
      success: true,
      response: aiResponse,
      metadata: {
        model: response.model || 'deepseek-chat',
        duration,
        tokensUsed: {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0,
          total: response.usage?.total_tokens || 0
        },
        timestamp: new Date().toISOString()
      },
      message: 'DeepSeek direct API test completed successfully'
    })

  } catch (error) {
    console.error('❌ DeepSeek direct API test failed:', error)
    
    let errorMessage = 'DeepSeek direct API test failed'
    let errorCode = 'DEEPSEEK_API_ERROR'
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        errorMessage = 'Invalid DeepSeek API key'
        errorCode = 'INVALID_API_KEY'
      } else if (error.message.includes('429')) {
        errorMessage = 'DeepSeek API rate limit exceeded'
        errorCode = 'RATE_LIMIT_EXCEEDED'
      } else if (error.message.includes('timeout')) {
        errorMessage = 'DeepSeek API request timed out'
        errorCode = 'REQUEST_TIMEOUT'
      } else if (error.message.includes('DEEPSEEK_API_KEY')) {
        errorMessage = 'DeepSeek API key not configured'
        errorCode = 'API_KEY_NOT_CONFIGURED'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
