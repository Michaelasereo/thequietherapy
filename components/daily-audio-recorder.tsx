import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, Square, Download } from "lucide-react";

interface DailyAudioRecorderProps {
  callObject: any;
  sessionId: string;
  onTranscriptionComplete?: (transcript: string) => void;
}

export default function DailyAudioRecorder({ 
  callObject, 
  sessionId, 
  onTranscriptionComplete 
}: DailyAudioRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      setError(null);
      audioChunks.current = [];

      // Get all audio tracks from the call
      const allTracks: MediaStreamTrack[] = [];
      
      // Get local audio stream from Daily.co
      try {
        const localAudio = callObject.localAudio();
        if (localAudio && localAudio.track) {
          allTracks.push(localAudio.track);
        }
      } catch (err) {
        console.log('Could not get local audio from Daily.co:', err);
      }

      // Add all remote participant audio tracks
      const participants = callObject.participants();
      Object.values(participants).forEach((participant: any) => {
        if (participant.tracks) {
          Object.values(participant.tracks).forEach((track: any) => {
            if (track?.state === "playable" && track?.track?.kind === "audio") {
              allTracks.push(track.track);
            }
          });
        }
      });

      if (allTracks.length === 0) {
        // Fallback: try to get any available audio stream
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          fallbackStream.getAudioTracks().forEach(track => {
            allTracks.push(track);
          });
          console.log('Using fallback audio stream');
        } catch (fallbackErr) {
          throw new Error("No audio tracks available for recording. Please ensure microphone permissions are granted.");
        }
      }

      // Create a MediaStream with all audio tracks
      const combinedStream = new MediaStream(allTracks);

      // Set up MediaRecorder
      const recorder = new MediaRecorder(combinedStream, { 
        mimeType: "audio/webm;codecs=opus" 
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Auto-transcribe the recording
        await transcribeAudio(audioBlob);
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setError("Recording failed. Please try again.");
        setRecording(false);
      };

      // Start recording
      recorder.start(1000); // Collect data every second
      setRecording(true);
      startTimeRef.current = Date.now();
      
      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

      console.log(`Started recording with ${allTracks.length} audio tracks`);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(err instanceof Error ? err.message : "Failed to start recording");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setTranscribing(true);
      setError(null);

      // Create form data
      const formData = new FormData();
      formData.append("file", audioBlob, "call-audio.webm");
      formData.append("sessionId", sessionId);

      // Send to backend for transcription
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Transcription failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Transcription API response:', result);
      
      // Handle empty or undefined transcription
      if (!result.text || result.text.trim() === '') {
        const message = 'Transcription completed but no speech was detected. This might be because the audio was silent or too short.';
        console.log(message);
        setTranscript(message);
        
        if (onTranscriptionComplete) {
          console.log('Calling onTranscriptionComplete with empty result message');
          onTranscriptionComplete(message);
        }
      } else {
        setTranscript(result.text);
        
        // Call the callback if provided
        if (onTranscriptionComplete) {
          console.log('Calling onTranscriptionComplete with:', result.text);
          onTranscriptionComplete(result.text);
        }
      }

      console.log("Transcription completed:", result.text || 'No text detected');
    } catch (err) {
      console.error("Error transcribing audio:", err);
      setError(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
    }
  };

  const downloadAudio = () => {
    if (audioURL) {
      const a = document.createElement("a");
      a.href = audioURL;
      a.download = `session-${sessionId}-audio.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Session Recorder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-between">
          <Button
            onClick={recording ? stopRecording : startRecording}
            variant={recording ? "destructive" : "default"}
            disabled={transcribing}
            className="flex items-center gap-2"
          >
            {recording ? (
              <>
                <Square className="h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
          
          {recording && (
            <Badge variant="secondary" className="font-mono">
              {formatDuration(recordingDuration)}
            </Badge>
          )}
        </div>

        {/* Status */}
        {recording && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            Recording in progress...
          </div>
        )}

        {transcribing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            Transcribing audio...
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Audio Player */}
        {audioURL && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Recorded Audio</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAudio}
                className="flex items-center gap-1"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
            <audio controls src={audioURL} className="w-full" />
          </div>
        )}

        {/* Transcript */}
        {transcript && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Transcription</h4>
            <div className="p-3 bg-gray-50 border rounded-md">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{transcript}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
