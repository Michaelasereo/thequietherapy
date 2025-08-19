import { DAILY_CONFIG } from './daily'

export interface RecordingConfig {
  room_name: string
  layout?: 'single' | 'grid' | 'speaker'
  audio_only?: boolean
  max_duration?: number
}

export interface Recording {
  id: string
  room_name: string
  status: 'started' | 'finished' | 'failed'
  download_url?: string
  audio_url?: string
  duration?: number
  started_at?: string
  finished_at?: string
}

/**
 * Start recording a Daily.co room
 */
export async function startRecording(config: RecordingConfig): Promise<Recording> {
  try {
    console.log('Starting recording for room:', config.room_name)
    
    const response = await fetch('https://api.daily.co/v1/recordings/start', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        room_name: config.room_name,
        layout: config.layout || 'single',
        audio_only: config.audio_only || false,
        max_duration: config.max_duration || 7200, // 2 hours default
        start_video_off: false,
        start_audio_off: false
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to start recording: ${error}`)
    }

    const recording = await response.json()
    console.log('Recording started:', recording.id)
    
    return {
      id: recording.id,
      room_name: config.room_name,
      status: 'started',
      started_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error starting recording:', error)
    throw new Error('Failed to start recording')
  }
}

/**
 * Stop recording a Daily.co room
 */
export async function stopRecording(recordingId: string): Promise<Recording> {
  try {
    console.log('Stopping recording:', recordingId)
    
    const response = await fetch(`https://api.daily.co/v1/recordings/${recordingId}/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to stop recording: ${error}`)
    }

    const recording = await response.json()
    console.log('Recording stopped:', recordingId)
    
    return {
      id: recording.id,
      room_name: recording.room_name,
      status: 'finished',
      download_url: recording.download_url,
      audio_url: recording.audio_url,
      duration: recording.duration,
      finished_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error stopping recording:', error)
    throw new Error('Failed to stop recording')
  }
}

/**
 * Get recording details
 */
export async function getRecording(recordingId: string): Promise<Recording> {
  try {
    const response = await fetch(`https://api.daily.co/v1/recordings/${recordingId}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get recording: ${error}`)
    }

    const recording = await response.json()
    
    return {
      id: recording.id,
      room_name: recording.room_name,
      status: recording.status,
      download_url: recording.download_url,
      audio_url: recording.audio_url,
      duration: recording.duration,
      started_at: recording.started_at,
      finished_at: recording.finished_at
    }
  } catch (error) {
    console.error('Error getting recording:', error)
    throw new Error('Failed to get recording')
  }
}

/**
 * List all recordings for a room
 */
export async function listRoomRecordings(roomName: string): Promise<Recording[]> {
  try {
    const response = await fetch(`https://api.daily.co/v1/recordings?room_name=${roomName}`, {
      headers: {
        'Authorization': `Bearer ${DAILY_CONFIG.DAILY_API_KEY}`
      }
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to list recordings: ${error}`)
    }

    const data = await response.json()
    return data.recordings || []
  } catch (error) {
    console.error('Error listing recordings:', error)
    return []
  }
}

/**
 * Download recording file
 */
export async function downloadRecording(downloadUrl: string, filePath: string): Promise<void> {
  try {
    console.log('Downloading recording to:', filePath)
    
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new Error(`Failed to download recording: ${response.statusText}`)
    }

    const buffer = await response.arrayBuffer()
    const fs = await import('fs')
    
    fs.writeFileSync(filePath, Buffer.from(buffer))
    console.log('Recording downloaded successfully')
  } catch (error) {
    console.error('Error downloading recording:', error)
    throw new Error('Failed to download recording')
  }
}

/**
 * Extract audio from video recording using ffmpeg
 */
export async function extractAudio(videoPath: string, audioPath: string): Promise<void> {
  try {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    console.log('Extracting audio from:', videoPath)
    
    const command = `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${audioPath}"`
    
    await execAsync(command)
    console.log('Audio extracted successfully to:', audioPath)
  } catch (error) {
    console.error('Error extracting audio:', error)
    throw new Error('Failed to extract audio from video')
  }
}

/**
 * Process recording: download, extract audio, and clean up
 */
export async function processRecording(recording: Recording, outputDir: string): Promise<{
  videoPath: string
  audioPath: string
}> {
  try {
    if (!recording.download_url) {
      throw new Error('No download URL available for recording')
    }

    const fs = await import('fs')
    const path = await import('path')
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    const videoPath = path.join(outputDir, `${recording.id}.mp4`)
    const audioPath = path.join(outputDir, `${recording.id}.wav`)

    // Download the recording
    await downloadRecording(recording.download_url, videoPath)

    // Extract audio
    await extractAudio(videoPath, audioPath)

    return {
      videoPath,
      audioPath
    }
  } catch (error) {
    console.error('Error processing recording:', error)
    throw new Error('Failed to process recording')
  }
}
