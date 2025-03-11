"use client";

import { useRef, useEffect } from "react";

interface AudioVisualizerProps {
  audioStream?: MediaStream;
  analyserNode?: AnalyserNode;
  isPlaying?: boolean;
  className?: string;
  barColor?: string;
  barCount?: number;
}

export function AudioVisualizer({
  audioStream,
  analyserNode,
  isPlaying = false,
  className = "",
  barColor = "hsl(var(--primary))",
  barCount = 64,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const analyserRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    let audioContext: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;

    const setupAudioAnalyser = async () => {
      if (analyserNode) {
        analyserRef.current = analyserNode;
        startVisualization();
        return;
      }

      if (!audioStream && !isPlaying) return;

      try {
        audioContext = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyserRef.current = analyser;

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        if (audioStream) {
          const source = audioContext.createMediaStreamSource(audioStream);
          source.connect(analyser);
        } else {
          // Create oscillator for demo visualization when no stream is available
          const oscillator = audioContext.createOscillator();
          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
          oscillator.connect(analyser);
          oscillator.start();
        }

        startVisualization();
      } catch (error) {
        console.error("Error setting up audio analyzer:", error);
      }
    };

    const startVisualization = () => {
      if (!canvasRef.current || !analyserRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!isPlaying && audioStream === undefined && !analyserNode) {
          // Generate random data for preview when not playing
          for (let i = 0; i < bufferLength; i++) {
            dataArray[i] = Math.random() * 100 + 50;
          }
        } else {
          analyser.getByteFrequencyData(dataArray);
        }

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        const barWidth = (WIDTH / barCount) * 0.8;
        const barSpacing = (WIDTH / barCount) * 0.2;
        let x = 0;

        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i * bufferLength) / barCount);
          const barHeight = (dataArray[index] / 255) * HEIGHT;

          ctx.fillStyle = barColor;
          ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

          x += barWidth + barSpacing;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    };

    setupAudioAnalyser();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audioStream, analyserNode, isPlaying, barColor, barCount]);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      width={300}
      height={100}
    />
  );
}
