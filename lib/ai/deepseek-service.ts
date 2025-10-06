// DeepSeek AI Service for TRPI Therapy Platform
interface DeepSeekClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
}

class DeepSeekClient {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;
  private maxRetries: number;

  constructor(options: DeepSeekClientOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://api.deepseek.com/v1';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 2;
  }

  async chatCompletionsCreate(params: any) {
    const url = `${this.baseURL}/chat/completions`;
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        console.log(`🤖 DeepSeek API request (attempt ${attempt + 1}/${this.maxRetries + 1}):`, {
          model: params.model,
          messages: params.messages?.length || 0,
          maxTokens: params.max_tokens
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = `DeepSeek API error: ${response.status} ${response.statusText}`;
          
          console.error('❌ DeepSeek API Error:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData
          });

          if (response.status === 429 && attempt < this.maxRetries) {
            // Rate limit - wait and retry
            const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`⏳ Rate limited, waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          throw new Error(`${errorMessage} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const result = await response.json();
        console.log('✅ DeepSeek API response received successfully');
        return result;

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if ((error as Error).name === 'AbortError') {
          lastError = new Error(`DeepSeek API timeout after ${this.timeout}ms`);
        }

        if (attempt === this.maxRetries) {
          break;
        }

        console.warn(`⚠️ DeepSeek API attempt ${attempt + 1} failed:`, lastError.message);
        
        // Wait before retry (except for rate limits which are handled above)
        if (!lastError.message.includes('429')) {
          const waitTime = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError || new Error('DeepSeek API request failed');
  }

  async modelsList() {
    const url = `${this.baseURL}/models`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }
}

// Singleton instance
let deepseekClient: DeepSeekClient | null = null;

export function getDeepSeekClient(): DeepSeekClient {
  if (!deepseekClient) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured in environment variables');
    }

    deepseekClient = new DeepSeekClient({
      apiKey,
      baseURL: process.env.DEEPSEEK_API_BASE || 'https://api.deepseek.com/v1',
      timeout: 30000,
      maxRetries: 2,
    });
  }
  
  return deepseekClient;
}

export async function generateSOAPNotesWithDeepSeek(transcript: string, sessionData: any) {
  const client = getDeepSeekClient();
  
  try {
    console.log('🧠 Generating SOAP notes with DeepSeek for session:', sessionData.id);
    
    const prompt = createSOAPPrompt(transcript, sessionData);
    
    const response = await client.chatCompletionsCreate({
      model: "deepseek-chat", // Use DeepSeek's chat model
      messages: [
        {
          role: "system",
          content: `You are a professional therapist assistant specializing in clinical documentation. 
          Generate comprehensive, accurate SOAP notes from therapy session transcripts. 
          Follow proper medical documentation standards, maintain patient confidentiality, and ensure clinical accuracy.
          
          Key requirements:
          - Use professional medical terminology
          - Be objective and factual
          - Maintain patient privacy
          - Follow SOAP format strictly
          - Include relevant clinical observations
          - Provide actionable treatment recommendations`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.2, // Low temperature for consistent, professional output
      top_p: 0.9,
      stream: false,
    });

    const notes = response.choices?.[0]?.message?.content;
    
    if (!notes) {
      throw new Error('Empty response from DeepSeek API');
    }

    console.log('✅ SOAP notes generated successfully with DeepSeek');
    return parseSOAPNotes(notes);

  } catch (error) {
    console.error('❌ DeepSeek SOAP generation failed:', error);
    
    if ((error as Error).message.includes('401')) {
      throw new Error('DeepSeek API key is invalid or expired');
    } else if ((error as Error).message.includes('402')) {
      throw new Error('DeepSeek API account has insufficient balance. Please add credits to your DeepSeek account.');
    } else if ((error as Error).message.includes('429')) {
      throw new Error('DeepSeek API rate limit exceeded. Please try again later.');
    } else if ((error as Error).message.includes('500')) {
      throw new Error('DeepSeek server error. Please try again later.');
    } else if ((error as Error).message.includes('timeout')) {
      throw new Error('DeepSeek API request timed out. Please try again.');
    }
    
    throw new Error(`DeepSeek AI processing failed: ${(error as Error).message}`);
  }
}

function createSOAPPrompt(transcript: string, sessionData: any): string {
  const sessionDate = new Date(sessionData.start_time || sessionData.scheduled_date).toLocaleDateString();
  
  return `
Generate comprehensive SOAP notes for this therapy session.

PATIENT INFORMATION:
- Patient: ${sessionData.patient_name || sessionData.patientName || 'Patient'}
- Session Date: ${sessionDate}
- Duration: ${sessionData.duration || sessionData.duration_minutes || 50} minutes
- Therapist: ${sessionData.therapist_name || sessionData.therapistName || 'Therapist'}
- Session Type: Individual Therapy

SESSION TRANSCRIPT:
${transcript}

Please generate detailed SOAP notes with the following sections:

## SUBJECTIVE
- Patient's self-reported concerns, feelings, and experiences
- Direct quotes from the patient that capture key emotional states
- Patient's perspective on their progress and current challenges
- Reported symptoms, mood changes, or significant events

## OBJECTIVE
- Therapist's clinical observations of patient's behavior, mood, and affect
- Notable non-verbal cues (body language, tone, facial expressions)
- Mental status examination findings
- Appearance, speech patterns, and cognitive functioning observations
- Any assessment tools or measurements used

## ASSESSMENT
- Clinical interpretation and diagnostic impressions
- Progress toward established treatment goals
- Current symptom severity and functional impairment
- Risk assessment (suicide, self-harm, violence if applicable)
- Therapeutic alliance and engagement level
- Differential diagnosis considerations

## PLAN
- Specific treatment interventions for next session
- Homework assignments or between-session activities
- Goals and objectives for upcoming sessions
- Medication recommendations or referrals if needed
- Follow-up scheduling and frequency
- Crisis intervention plan if applicable

Format the response as clean markdown with clear section headings. Be thorough but concise, focusing on clinically relevant information that supports treatment planning and continuity of care.
`;
}

function parseSOAPNotes(notes: string) {
  const sections = {
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  };

  const lines = notes.split('\n');
  let currentSection = '';

  for (const line of lines) {
    // Skip main title
    if (line.startsWith('# ')) continue;
    
    // Detect section headers
    if (line.match(/^##?\s*SUBJECTIVE/i)) {
      currentSection = 'subjective';
      continue;
    } else if (line.match(/^##?\s*OBJECTIVE/i)) {
      currentSection = 'objective';
      continue;
    } else if (line.match(/^##?\s*ASSESSMENT/i)) {
      currentSection = 'assessment';
      continue;
    } else if (line.match(/^##?\s*PLAN/i)) {
      currentSection = 'plan';
      continue;
    }

    // Add content to current section
    if (currentSection && sections[currentSection as keyof typeof sections] !== undefined) {
      sections[currentSection as keyof typeof sections] += line + '\n';
    }
  }

  // Clean up whitespace
  Object.keys(sections).forEach(key => {
    sections[key as keyof typeof sections] = sections[key as keyof typeof sections].trim();
  });

  return {
    raw: notes,
    structured: sections,
    summary: generateSummary(sections),
    wordCount: notes.split(' ').length,
    generatedAt: new Date().toISOString(),
    provider: 'deepseek'
  };
}

function generateSummary(sections: any): string {
  const keyTopics = extractKeyTopics(sections.subjective);
  const progress = extractProgress(sections.assessment);
  const nextSteps = extractNextSteps(sections.plan);
  
  return `Session focused on ${keyTopics}. ${progress}. Next steps: ${nextSteps}`;
}

function extractKeyTopics(text: string): string {
  if (!text) return 'general therapeutic concerns';
  
  const sentences = text.split('.').filter(s => s.trim().length > 0);
  const firstSentence = sentences[0]?.trim() || '';
  
  // Extract key themes from the first sentence
  const keywords = ['anxiety', 'depression', 'stress', 'relationship', 'work', 'family', 'trauma', 'grief'];
  const foundKeywords = keywords.filter(keyword => 
    firstSentence.toLowerCase().includes(keyword)
  );
  
  if (foundKeywords.length > 0) {
    return foundKeywords.join(' and ') + ' issues';
  }
  
  return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence;
}

function extractProgress(text: string): string {
  if (!text) return 'Progress assessment pending';
  
  const sentences = text.split('.').filter(s => s.trim().length > 0);
  const progressSentence = sentences.find(s => 
    s.toLowerCase().includes('progress') || 
    s.toLowerCase().includes('improvement') ||
    s.toLowerCase().includes('better') ||
    s.toLowerCase().includes('worse')
  );
  
  return progressSentence?.trim() || sentences[0]?.trim() || 'Clinical assessment completed';
}

function extractNextSteps(text: string): string {
  if (!text) return 'Continue current treatment approach';
  
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const firstAction = lines.find(l => 
    l.includes('-') || 
    l.toLowerCase().includes('continue') ||
    l.toLowerCase().includes('practice') ||
    l.toLowerCase().includes('homework')
  );
  
  if (firstAction) {
    return firstAction.replace(/^[-*]\s*/, '').trim();
  }
  
  return lines[0]?.trim() || 'Continue therapeutic interventions';
}

// Utility function to test DeepSeek connection
export async function testDeepSeekConnection(): Promise<{
  success: boolean;
  models?: any[];
  error?: string;
}> {
  try {
    const client = getDeepSeekClient();
    const response = await client.modelsList();
    
    return {
      success: true,
      models: response.data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? (error as Error).message : 'Unknown error'
    };
  }
}
