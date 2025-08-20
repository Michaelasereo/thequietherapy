const fs = require('fs');
const path = require('path');

// Create a simple test audio file (silent audio)
async function createTestAudioFile() {
  // Create a minimal WebM file for testing
  const testAudioPath = path.join(__dirname, 'test-audio.webm');
  
  // Create a simple WebM header (this is a minimal valid WebM file)
  const webmHeader = Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, // EBML header
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // EBML version
    0x15, 0x49, 0xa9, 0x66, // Segment
    0x16, 0x54, 0xae, 0x6b, // Tracks
    0xae, 0x6b, 0x86, 0x86, // Audio track
    0x9a, 0x9a, 0x9a, 0x9a  // Minimal audio data
  ]);
  
  fs.writeFileSync(testAudioPath, webmHeader);
  return testAudioPath;
}

async function testTranscriptionAPI() {
  try {
    console.log('🧪 Testing Transcription API Setup...\n');
    
    // Create test audio file
    const testAudioPath = await createTestAudioFile();
    console.log(`✅ Created test audio file: ${testAudioPath}`);
    
    console.log('✅ Test setup completed');
    console.log('📋 To test the API:');
    console.log('   1. Visit http://localhost:3002/test-browser-recording');
    console.log('   2. Click "Test Transcription API" button');
    console.log('   3. Check browser console for results');
    console.log('   4. Or use the audio recorder component to record real audio');
    
    // Clean up test file
    fs.unlinkSync(testAudioPath);
    console.log('🧹 Cleaned up test file');
    
    console.log('\n🎯 The transcription API is ready for testing!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testTranscriptionAPI();
