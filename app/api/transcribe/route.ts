import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Use OpenAI for transcription (Whisper model)
import OpenAI from 'openai';

// Check which AI provider is configured
const USE_DEEPSEEK_TRANSCRIPTION = process.env.USE_DEEPSEEK_FOR_TRANSCRIPTION === 'true';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData() as any;
    const fileEntry = formData.get('file');
    const file = fileEntry instanceof File ? fileEntry : null;
    const sessionId = formData.get('sessionId') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    console.log(`Transcribing audio for session: ${sessionId}`);
    console.log(`File size: ${file.size} bytes, type: ${file.type}`);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file temporarily (for serverless compatibility, use /tmp)
    const tempDir = '/tmp';
    const fileName = `session-${sessionId}-${Date.now()}.webm`;
    const filePath = join(tempDir, fileName);

    try {
      await writeFile(filePath, buffer);
      console.log(`Audio file saved to: ${filePath}`);

      // Transcribe with OpenAI Whisper (DeepSeek doesn't have an audio transcription API)
      // Note: OpenAI Whisper is currently the best option for audio transcription
      // DeepSeek is used for SOAP notes generation (text-to-text)
      console.log('Starting transcription with OpenAI Whisper...');
      console.log('Note: Using OpenAI Whisper for transcription, DeepSeek will be used for SOAP notes generation');
      
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: 'en', // Optional: specify language for better accuracy
        response_format: 'text',
      });
      console.log('Transcription completed successfully');

      // When using response_format: 'text', OpenAI returns the transcription as a string
      const transcriptionText = transcription as string;
      console.log('Transcription text length:', transcriptionText.length);

      // Store transcription in database
      try {
        await supabase
          .from('session_notes')
          .upsert({
            session_id: sessionId,
            transcript: transcriptionText,
            ai_generated: true,
            created_at: new Date().toISOString(),
          });

        console.log('Transcription stored in database');
      } catch (dbError) {
        console.error('Error storing transcription in database:', dbError);
        // Don't fail the request if database storage fails
      }

      // Clean up temp file
      try {
        await writeFile(filePath, ''); // Clear the file
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      return NextResponse.json({
        success: true,
        text: transcriptionText,
        sessionId,
        message: 'Audio transcribed successfully'
      });

    } catch (fileError) {
      console.error('Error processing audio file:', fileError);
      return NextResponse.json(
        { error: 'Failed to process audio file' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in transcription API:', error);
    return NextResponse.json(
      { 
        error: 'Transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
