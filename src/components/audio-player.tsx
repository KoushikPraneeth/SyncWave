"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";
import { AudioVisualizer } from "./audio-visualizer";

interface AudioPlayerProps {
  audioUrl?: string;
  audioStream?: MediaStream;
  isHost?: boolean;
  onPlayPause?: (isPlaying: boolean, currentTime: number) => void;
  onVolumeChange?: (volume: number) => void;
  externalPlayState?: boolean;
  externalTimestamp?: number;
  className?: string;
}

export function AudioPlayer({
  audioUrl,
  audioStream,
  isHost = false,
  onPlayPause,
  onVolumeChange,
  externalPlayState,
  externalTimestamp,
  className = "",
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [audioSource, setAudioSource] = useState<
    MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null
  >(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Initialize audio context and analyzer
  useEffect(() => {
    if (typeof window === "undefined") return;

    const context = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const analyserNode = context.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.8;

    setAudioContext(context);
    setAnalyser(analyserNode);

    return () => {
      context.close();
    };
  }, []);

  // Set up audio source when audio element or stream changes
  useEffect(() => {
    if (!audioContext || !analyser) return;

    let source:
      | MediaElementAudioSourceNode
      | MediaStreamAudioSourceNode
      | null = null;

    if (audioRef.current && audioUrl) {
      source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
    } else if (audioStream) {
      source = audioContext.createMediaStreamSource(audioStream);
      source.connect(analyser);
    }

    setAudioSource(source);

    return () => {
      if (source) {
        source.disconnect();
      }
    };
  }, [audioContext, analyser, audioUrl, audioStream]);

  // Handle external play state changes (for client mode)
  useEffect(() => {
    if (externalPlayState !== undefined && !isHost && audioRef.current) {
      if (externalPlayState && !isPlaying) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else if (!externalPlayState && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [externalPlayState, isHost, isPlaying]);

  // Handle external timestamp changes (for client mode)
  useEffect(() => {
    if (
      externalTimestamp !== undefined &&
      !isHost &&
      audioRef.current &&
      !isSeeking
    ) {
      const diff = Math.abs(
        audioRef.current.currentTime * 1000 - externalTimestamp,
      );

      // Only sync if the difference is more than 500ms
      if (diff > 500) {
        audioRef.current.currentTime = externalTimestamp / 1000;
      }
    }
  }, [externalTimestamp, isHost, isSeeking]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(console.error);
    }

    setIsPlaying(!isPlaying);

    if (onPlayPause) {
      onPlayPause(!isPlaying, audioRef.current.currentTime * 1000);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);

    if (onVolumeChange) {
      onVolumeChange(newVolume[0]);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          hidden
        />
      )}

      <div className="w-full h-24 bg-card rounded-lg mb-6 overflow-hidden">
        <AudioVisualizer
          audioStream={audioStream}
          isPlaying={isPlaying}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <Button
          size="icon"
          variant="outline"
          onClick={handlePlayPause}
          disabled={!isHost && externalPlayState !== undefined}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>

        {isHost && (
          <Button size="icon" variant="outline">
            <SkipForward size={24} />
          </Button>
        )}

        {!isHost && externalPlayState !== undefined && (
          <p className="text-sm text-muted-foreground">
            Playback controlled by host
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 w-full">
        <Volume2 size={20} className="text-muted-foreground" />
        <Slider
          value={volume}
          onValueChange={handleVolumeChange}
          max={100}
          step={1}
          className="flex-1"
        />
        <span className="text-sm text-muted-foreground w-8 text-right">
          {volume[0]}%
        </span>
      </div>
    </div>
  );
}
