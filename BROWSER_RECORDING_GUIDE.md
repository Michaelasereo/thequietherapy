# Browser-Based Audio Recording Integration Guide

## 🎯 **Overview**

This guide explains how to integrate the new browser-based audio recording functionality into your Daily.co video calls. This solution eliminates the need for Daily.co's premium recording API and provides real-time audio capture with immediate transcription.

## ✅ **Features**

- **No Premium Required**: Works with any Daily.co plan
- **All Participants**: Captures both local and remote audio
- **Real-time Feedback**: Visual recording status and duration
- **Immediate Transcription**: OpenAI Whisper integration
- **Database Storage**: Automatic transcription storage
- **Download Support**: Audio files can be downloaded

## 🚀 **Quick Integration**

### 1. **Import the Component**

```tsx
import DailyAudioRecorder from '@/components/daily-audio-recorder';
```

### 2. **Use in Your Video Call Component**

```tsx
import { useEffect, useState } from 'react';
import DailyAudioRecorder from '@/components/daily-audio-recorder';

export default function VideoCall({ sessionId }: { sessionId: string }) {
  const [callObject, setCallObject] = useState<any>(null);

  // Initialize Daily.co call object
  useEffect(() => {
    const initCall = async () => {
      const DailyIframe = (await import('@daily-co/daily-js')).default;
      const call = DailyIframe.createCallObject();
      setCallObject(call);
    };
    initCall();
  }, []);

  const handleTranscriptionComplete = (transcript: string) => {
    console.log('Transcription completed:', transcript);
    // Handle the transcription (e.g., save to database, show to user)
  };

  return (
    <div>
      {/* Your existing video call UI */}
      
      {/* Add the audio recorder */}
      {callObject && (
        <DailyAudioRecorder
          callObject={callObject}
          sessionId={sessionId}
          onTranscriptionComplete={handleTranscriptionComplete}
        />
      )}
    </div>
  );
}
```

## 🔧 **API Endpoint**

The transcription API is automatically available at `/api/transcribe`:

```typescript
// The component automatically calls this endpoint
POST /api/transcribe
Content-Type: multipart/form-data

Body:
- file: Audio file (WebM format)
- sessionId: Session identifier
```

## 📋 **Component Props**

```typescript
interface DailyAudioRecorderProps {
  callObject: any;                    // Daily.co call object
  sessionId: string;                  // Session identifier
  onTranscriptionComplete?: (transcript: string) => void; // Optional callback
}
```

## 🎨 **Customization**

### **Styling**
The component uses Tailwind CSS classes and can be customized:

```tsx
<DailyAudioRecorder
  callObject={callObject}
  sessionId={sessionId}
  className="custom-styles" // Add custom classes
/>
```

### **Callbacks**
Handle transcription completion:

```tsx
const handleTranscriptionComplete = (transcript: string) => {
  // Save to database
  saveTranscriptionToDatabase(sessionId, transcript);
  
  // Show notification
  showNotification('Transcription completed!');
  
  // Trigger AI analysis
  triggerAIAnalysis(transcript);
};
```

## 🔍 **Testing**

### **Test Page**
Visit `/test-browser-recording` to test the functionality:

1. **Initialize Daily.co**: Creates a call object
2. **Test Transcription API**: Verifies backend functionality
3. **Record Audio**: Test the recording component
4. **View Results**: See transcription and audio playback

### **Manual Testing**
```bash
# Test the transcription API directly
curl -X POST http://localhost:3000/api/transcribe \
  -F "file=@test-audio.webm" \
  -F "sessionId=test-session-123"
```

## 🛠 **Technical Details**

### **Audio Format**
- **Recording**: WebM with Opus codec
- **Quality**: High-quality audio capture
- **Size**: Optimized for web transmission

### **Browser Support**
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

### **Security**
- **Local Processing**: Audio processed in browser before upload
- **Temporary Storage**: Files stored temporarily on server
- **Automatic Cleanup**: Temporary files cleaned up after processing

## 📊 **Database Schema**

Transcriptions are automatically stored in the `session_notes` table:

```sql
-- Transcriptions are stored here
INSERT INTO session_notes (
  session_id,
  transcript,
  ai_generated,
  created_at
) VALUES (
  'session-id',
  'transcribed text...',
  true,
  NOW()
);
```

## 🚨 **Error Handling**

The component handles various error scenarios:

- **No Audio Tracks**: Shows error if no participants are speaking
- **Recording Failures**: Graceful handling of MediaRecorder errors
- **Transcription Failures**: Error display for API failures
- **Network Issues**: Retry logic for failed uploads

## 📱 **Mobile Support**

The component works on mobile devices:

- **iOS Safari**: Full support
- **Android Chrome**: Full support
- **Responsive Design**: Adapts to mobile screen sizes

## 🔄 **Workflow**

1. **User joins video call**
2. **Clicks "Start Recording"**
3. **Component captures all audio tracks**
4. **User clicks "Stop Recording"**
5. **Audio file uploaded to server**
6. **OpenAI Whisper transcribes audio**
7. **Transcription stored in database**
8. **User can download audio file**
9. **Transcription displayed to user**

## 🎉 **Benefits**

### **For Users:**
- **Real-time Feedback**: See recording status and duration
- **Immediate Results**: Transcription available right after recording
- **Download Support**: Save audio files locally
- **No Premium Required**: Works with any Daily.co plan

### **For Developers:**
- **Simple Integration**: Drop-in component
- **No Server Complexity**: Browser handles recording
- **Cost Effective**: No additional API fees
- **Scalable**: Works with any number of participants

## 📞 **Support**

If you need help:
1. Check the test page: `/test-browser-recording`
2. Review browser console for errors
3. Verify Daily.co call object is properly initialized
4. Ensure OpenAI API key is configured

The browser-based recording solution provides a complete, production-ready audio recording and transcription system! 🚀
