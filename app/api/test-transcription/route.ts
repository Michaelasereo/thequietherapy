import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    // Test OpenAI API connection
    console.log('Testing OpenAI API connection...');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        error: 'OpenAI API key not configured',
        success: false
      }, { status: 500 });
    }

    // Test with a simple audio file (you can create a minimal test audio)
    // For now, just test the API connection
    const models = await openai.models.list();
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API connection successful',
      models_count: models.data.length,
      whisper_available: models.data.some(model => model.id.includes('whisper'))
    });

  } catch (error) {
    console.error('Error testing transcription API:', error);
    return NextResponse.json({
      error: 'Transcription API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string || 'test-session';

    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log(`Testing transcription for session: ${sessionId}`);
    console.log(`File size: ${file.size} bytes, type: ${file.type}`);

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file temporarily
    const tempDir = '/tmp';
    const fileName = `test-transcription-${Date.now()}.webm`;
    const filePath = join(tempDir, fileName);

    try {
      await writeFile(filePath, buffer);
      console.log(`Test audio file saved to: ${filePath}`);

      // Transcribe with OpenAI Whisper
      console.log('Starting test transcription with OpenAI Whisper...');
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text',
      });
      
      console.log('Test transcription completed successfully');
      console.log('Transcription result type:', typeof transcription);
      console.log('Transcription result:', transcription);

      const transcriptionText = transcription as string;
      console.log('Transcription text:', transcriptionText);

      // Clean up temp file
      try {
        await writeFile(filePath, '');
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }

      return NextResponse.json({
        success: true,
        text: transcriptionText,
        sessionId,
        message: 'Test transcription completed successfully',
        file_size: file.size,
        file_type: file.type
      });

    } catch (fileError) {
      console.error('Error processing test audio file:', fileError);
      return NextResponse.json(
        { error: 'Failed to process test audio file', details: fileError },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in test transcription API:', error);
    return NextResponse.json(
      { 
        error: 'Test transcription failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
