// DeepSeek Configuration Validation Script for TRPI
import { getDeepSeekClient, testDeepSeekConnection } from '../lib/ai/deepseek-service';
import { getAIServiceStats } from '../lib/ai';

async function validateDeepSeekConfiguration() {
  console.log('🔍 Validating DeepSeek configuration for TRPI...\n');

  const stats = getAIServiceStats();
  
  console.log('AI Provider Status:');
  console.log(`- DeepSeek: ${stats.configuration.deepseek.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- OpenAI: ${stats.configuration.openai.configured ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`- Fallback: ${stats.configuration.fallback.configured ? '✅ Available' : '❌ Not available'}`);
  console.log(`- Default Provider: ${stats.defaultProvider}`);

  if (!stats.configuration.deepseek.configured) {
    console.log('\n❌ DEEPSEEK_API_KEY is not set in environment variables');
    console.log('Please add your DeepSeek API key to .env.local:');
    console.log('DEEPSEEK_API_KEY=sk-your-api-key-here');
    process.exit(1);
  }

  console.log('\n✅ DEEPSEEK_API_KEY is present');
  console.log(`   Key Length: ${stats.configuration.deepseek.keyLength} characters`);
  console.log(`   API Base: ${stats.configuration.deepseek.baseURL}`);

  // Test DeepSeek client initialization
  try {
    console.log('\n🤖 Testing DeepSeek client initialization...');
    const client = getDeepSeekClient();
    console.log('✅ DeepSeek client initialized successfully');

    // Test API connection
    console.log('\n🧪 Testing DeepSeek API connection...');
    const connectionTest = await testDeepSeekConnection();
    
    if (connectionTest.success) {
      console.log('✅ DeepSeek API connection successful');
      console.log(`   Available models: ${connectionTest.models?.length || 0} models`);
      
      // Check for specific models
      const models = connectionTest.models || [];
      const deepseekChatModel = models.find((model: any) => 
        model.id.includes('deepseek-chat')
      );
      
      console.log(`   DeepSeek Chat model available: ${deepseekChatModel ? '✅' : '❌'}`);
      
      if (deepseekChatModel) {
        console.log(`   Model ID: ${deepseekChatModel.id}`);
      }
      
      // Show first few available models
      if (models.length > 0) {
        console.log('\n   Available models:');
        models.slice(0, 5).forEach((model: any) => {
          console.log(`     - ${model.id}`);
        });
        if (models.length > 5) {
          console.log(`     ... and ${models.length - 5} more models`);
        }
      }

      // Test SOAP notes generation
      console.log('\n🧠 Testing SOAP notes generation...');
      const testTranscript = `
        Patient: I've been feeling really anxious about work lately. The deadlines are overwhelming me.
        Therapist: Can you tell me more about what specifically is causing the most anxiety?
        Patient: It's the constant pressure. I feel like I can't keep up, and I'm worried I'll disappoint my team.
        Therapist: That sounds very stressful. How have you been coping with these feelings?
        Patient: I've been trying the breathing exercises we practiced, but sometimes I forget to use them.
        Therapist: It's good that you're remembering to use the techniques sometimes. Let's work on making that more consistent.
      `;

      const testSessionData = {
        id: 'test-session-validation',
        patient_name: 'Test Patient',
        therapist_name: 'Test Therapist',
        start_time: new Date().toISOString(),
        duration: 50
      };

      try {
        const { generateSOAPNotesWithDeepSeek } = await import('../lib/ai/deepseek-service');
        const soapNotes = await generateSOAPNotesWithDeepSeek(testTranscript, testSessionData);
        
        console.log('✅ SOAP notes generation successful');
        console.log(`   Generated ${soapNotes.wordCount || 'unknown'} words`);
        console.log(`   Provider: ${soapNotes.provider}`);
        console.log(`   Summary: ${soapNotes.summary.substring(0, 100)}...`);
        
        // Validate SOAP structure
        const hasAllSections = soapNotes.structured.subjective && 
                              soapNotes.structured.objective && 
                              soapNotes.structured.assessment && 
                              soapNotes.structured.plan;
        
        console.log(`   SOAP Structure Complete: ${hasAllSections ? '✅' : '❌'}`);
        
        if (!hasAllSections) {
          console.log('   Missing sections:');
          if (!soapNotes.structured.subjective) console.log('     - Subjective');
          if (!soapNotes.structured.objective) console.log('     - Objective');
          if (!soapNotes.structured.assessment) console.log('     - Assessment');
          if (!soapNotes.structured.plan) console.log('     - Plan');
        }

      } catch (soapError) {
        console.log('❌ SOAP notes generation failed:');
        console.log(`   Error: ${soapError.message}`);
        
        if (soapError.message.includes('401')) {
          console.log('   → API key is invalid or expired');
        } else if (soapError.message.includes('429')) {
          console.log('   → Rate limit exceeded, this is normal for testing');
        } else if (soapError.message.includes('quota')) {
          console.log('   → API quota exceeded');
        }
      }

    } else {
      console.log('❌ DeepSeek API connection failed:');
      console.log(`   Error: ${connectionTest.error}`);
    }

  } catch (error) {
    console.log('❌ DeepSeek validation failed:');
    
    if ((error as Error).message.includes('401')) {
      console.log('   Error: Invalid API key');
      console.log('   → Check that your DEEPSEEK_API_KEY is correct');
    } else if ((error as Error).message.includes('429')) {
      console.log('   Error: Rate limit exceeded');
      console.log('   → This is normal during testing, try again later');
    } else if ((error as Error).message.includes('404')) {
      console.log('   Error: API endpoint not found');
      console.log('   → Check DEEPSEEK_API_BASE URL');
    } else if ((error as Error).message.includes('ENOTFOUND') || (error as Error).message.includes('network')) {
      console.log('   Error: Network connection failed');
      console.log('   → Check your internet connection');
    } else {
      console.log(`   Error: ${(error as Error).message}`);
    }
    
    process.exit(1);
  }

  // Show recommendations
  console.log('\n📋 Recommendations:');
  stats.recommendations.forEach(rec => {
    console.log(`   • ${rec}`);
  });

  console.log('\n🎉 DeepSeek configuration validation completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the AI processing API: /api/ai/process-session');
  console.log('2. Visit the AI test page: /test-ai-integration');
  console.log('3. Try the complete video flow: /test-video-complete-flow');
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateDeepSeekConfiguration().catch((error) => {
    console.error('\n💥 Validation script failed:', error);
    process.exit(1);
  });
}

export { validateDeepSeekConfiguration };
