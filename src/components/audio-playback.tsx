import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { AudioDataMetadata } from '@/lib/audio-sync-client';

interface AudioPlaybackProps {
  isPlaying: boolean;
  volume: number;
  onPlaybackError?: (error: Error) => void;
}

export interface AudioPlaybackHandle {
  addAudioData: (data: ArrayBuffer, timestamp: number, metadata: AudioDataMetadata) => void;
}

const AudioPlayback = forwardRef<AudioPlaybackHandle, AudioPlaybackProps>(({
  isPlaying,
  volume,
  onPlaybackError
}, ref) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioDataQueueRef = useRef<Array<{data: ArrayBuffer, timestamp: number, metadata: AudioDataMetadata}>>([]);
  const startTimeRef = useRef<number>(0);
  const lastTimestampRef = useRef<number>(0);
  const bufferSizeRef = useRef<number>(300); // Default buffer size in ms
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [audioLevel, setAudioLevel] = useState<number>(0);
  
  // Initialize audio context
  useEffect(() => {
    try {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      // Connect nodes
      gainNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      // Set up analyser
      analyserRef.current.fftSize = 256;
      
      // Set up animation loop for visualizer
      const updateVisualizer = () => {
        if (analyserRef.current && canvasRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          // Calculate average level
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setAudioLevel(average / 255); // Normalize to 0-1
          
          // Draw visualization
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const width = canvas.width;
            const height = canvas.height;
            
            ctx.clearRect(0, 0, width, height);
            
            // Draw waveform
            ctx.fillStyle = '#4f46e5';
            const barWidth = width / bufferLength;
            
            for (let i = 0; i < bufferLength; i++) {
              const barHeight = (dataArray[i] / 255) * height;
              ctx.fillRect(i * barWidth, height - barHeight, barWidth, barHeight);
            }
          }
        }
        requestAnimationFrame(updateVisualizer);
      };
      
      updateVisualizer();
      
      return () => {
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close();
        }
      };
    } catch (error) {
      console.error('Error initializing audio context:', error);
      if (onPlaybackError) {
        onPlaybackError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }, [onPlaybackError]);
  
  // Handle volume changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);
  
  // Process audio data queue
  const processAudioQueue = async () => {
    if (!audioContextRef.current || audioDataQueueRef.current.length === 0) return;
    
    // Sort queue by timestamp to ensure correct order
    audioDataQueueRef.current.sort((a, b) => a.timestamp - b.timestamp);
    
    // Get the next audio chunk
    const nextChunk = audioDataQueueRef.current[0];
    if (!nextChunk) return;
    
    try {
      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(nextChunk.data);
      audioBufferRef.current = audioBuffer;
      
      // Calculate timing
      const currentTime = audioContextRef.current.currentTime;
      const timeSinceStart = (Date.now() - startTimeRef.current) / 1000;
      const targetTime = nextChunk.timestamp / 1000;
      
      // Dynamic buffer size based on metadata and network conditions
      const baseBuffer = bufferSizeRef.current / 1000; // Convert to seconds
      const networkJitter = 0.05; // 50ms jitter allowance
      const minBuffer = 0.1; // Minimum 100ms buffer
      const bufferTime = Math.max(baseBuffer + networkJitter, minBuffer);
      
      // Calculate delay accounting for network jitter and system clock differences
      const rawDelay = targetTime - timeSinceStart + bufferTime;
      const maxDelay = 1.0; // Maximum 1 second delay to prevent excessive latency
      let playbackDelay = Math.min(Math.max(0, rawDelay), maxDelay);
      
      // If we're falling too far behind, skip chunks to catch up
      if (rawDelay < -0.5) { // If we're more than 500ms behind
        console.warn('Audio playback falling behind, skipping chunks to catch up');
        while (audioDataQueueRef.current.length > 0 && 
               (audioDataQueueRef.current[0].timestamp / 1000 - timeSinceStart + bufferTime) < -0.1) {
          audioDataQueueRef.current.shift();
        }
        return; // Process next chunk on next iteration
      }
      
      // Create and schedule source node with precise timing
      const sourceNode = audioContextRef.current.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(gainNodeRef.current!);
      
      // Store the source node for later control
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      sourceNodeRef.current = sourceNode;
      
      // Schedule playback with precise timing
      const scheduledTime = currentTime + playbackDelay;
      sourceNode.start(scheduledTime);
      
      // Remove the chunk from queue only after successful scheduling
      audioDataQueueRef.current.shift();
      lastTimestampRef.current = nextChunk.timestamp;
      
      // Log timing information
      console.debug(
        `Audio scheduled: timestamp=${nextChunk.timestamp}ms, ` +
        `delay=${playbackDelay.toFixed(3)}s, ` +
        `buffer=${bufferTime.toFixed(3)}s, ` +
        `queue=${audioDataQueueRef.current.length}`
      );
      
      // Schedule next chunk processing
      if (audioDataQueueRef.current.length > 0) {
        setTimeout(processAudioQueue, Math.max(0, playbackDelay * 1000 - 50)); // Process next chunk slightly before current one finishes
      }
    } catch (error) {
      console.error('Error processing audio data:', error);
      if (onPlaybackError) {
        onPlaybackError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  };
  
  // Public method to add audio data to the queue
  const addAudioData = (data: ArrayBuffer, timestamp: number, metadata: AudioDataMetadata) => {
    // Update buffer size if provided in metadata
    if (metadata.bufferSize > 0) {
      bufferSizeRef.current = metadata.bufferSize;
    }
    
    // Initialize start time if this is the first chunk
    if (startTimeRef.current === 0) {
      startTimeRef.current = Date.now() - timestamp;
    }
    
    // Add to queue
    audioDataQueueRef.current.push({ data, timestamp, metadata });
    
    // Process the queue
    processAudioQueue();
  };
  
  // Expose the addAudioData method
  React.useImperativeHandle(
    ref,
    () => ({
      addAudioData
    }),
    []
  );
  
  // Handle play/pause
  useEffect(() => {
    if (!audioContextRef.current) return;
    
    if (isPlaying) {
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } else {
      if (audioContextRef.current.state === 'running') {
        audioContextRef.current.suspend();
      }
    }
  }, [isPlaying]);
  
  return (
    <div className="audio-playback">
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={50} 
        className="w-full h-12 bg-gray-100 rounded-md"
      />
      <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-100" 
          style={{ width: `${audioLevel * 100}%` }}
        />
      </div>
    </div>
  );
});

export default AudioPlayback;
