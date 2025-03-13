"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Volume2 } from "lucide-react";
import { AudioPlayer } from "@/components/audio-player";
import { AudioVisualizer } from "@/components/audio-visualizer";
import { getAudioSyncClient } from "@/lib/audio-sync-client";
import { AudioSource } from "@/lib/audio-sync";
import { useToast } from "@/components/ui/use-toast";

export default function ClientPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [roomCode, setRoomCode] = useState(
    searchParams?.get("code") || ""
  );
  const [deviceName, setDeviceName] = useState(
    typeof localStorage !== "undefined"
      ? localStorage.getItem("deviceName") || `Device-${Math.floor(Math.random() * 1000)}`
      : `Device-${Math.floor(Math.random() * 1000)}`
  );
  const [isConnected, setIsConnected] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<"good" | "medium" | "poor" | "disconnected">("disconnected");
  const [latency, setLatency] = useState(0);

  // Initialize audio sync client
  useEffect(() => {
    const audioSyncClient = getAudioSyncClient({
      onRoomJoined: (room) => {
        setIsConnected(true);
        setIsJoining(false);
        // Set connection quality to good when successfully joined
        setConnectionQuality("good");
        toast({
          title: "Connected to Room",
          description: `Successfully joined room ${room.code}`,
        });
      },
      onRoomLeft: () => {
        setIsConnected(false);
        setAudioSource(null);
        setConnectionQuality("disconnected");
        toast({
          title: "Disconnected",
          description: "You have left the room",
        });
      },
      onPlaybackChanged: (isPlaying, timestamp) => {
        setIsPlaying(isPlaying);
        setCurrentTimestamp(timestamp);
      },
      onVolumeChanged: (volume) => {
        setVolume([volume]);
      },
      onAudioSourceChanged: (source) => {
        setAudioSource(source);
        toast({
          title: "Audio Source Changed",
          description: `Host changed audio source to ${source.type}`,
        });
      },
      // Add audio data handler
      onAudioData: (audioData, timestamp, metadata) => {
        console.log(`Received audio data at timestamp ${timestamp}, metadata:`, metadata);
        
        try {
          // Create a simple audio element to play the audio
          // This is a much simpler approach than using the Web Audio API
          const audio = new Audio();
          
          // Convert the audio data to a base64 URL
          let base64Data;
          if (typeof audioData === 'string') {
            base64Data = audioData;
          } else {
            // Convert ArrayBuffer to base64 string
            const bytes = new Uint8Array(audioData);
            let binary = '';
            for (let i = 0; i < bytes.byteLength; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            base64Data = window.btoa(binary);
          }
          
          // Create a data URL for the audio
          // Using WAV format as specified in the audio-sync-client.ts
          const dataUrl = `data:audio/wav;base64,${base64Data}`;
          audio.src = dataUrl;
          
          // Log that we're attempting to play audio
          console.log("Setting up audio element with data URL, length:", dataUrl.length);
          
          // Play the audio
          audio.play()
            .then(() => {
              console.log("Successfully playing audio data");
              // Update connection quality to good when receiving audio data
              setConnectionQuality("good");
            })
            .catch(err => {
              console.error("Error playing audio:", err);
            });
        } catch (error) {
          console.error("Error processing audio data:", error);
        }
      },
      onConnectionQualityChanged: (quality) => {
        setConnectionQuality(quality as "good" | "medium" | "poor" | "disconnected");
      },
      onError: (error) => {
        console.error("Audio sync error:", error);
        setIsJoining(false);
        toast({
          title: "Connection Error",
          description: "Failed to connect to audio sync server",
          variant: "destructive",
        });
      },
    });

    // Connect to WebSocket server and handle auto-join
    const initializeClient = async () => {
      try {
        await audioSyncClient.connect("ws://localhost:8080/ws");
        console.log("WebSocket connection established");
        
        // Auto-join if room code is in URL
        if (searchParams?.get("code")) {
          // Small delay to ensure everything is initialized
          setTimeout(() => {
            joinRoom().catch(error => {
              console.error("Auto-join failed:", error);
            });
          }, 300);
        }
      } catch (error) {
        console.error("Failed to connect to WebSocket server:", error);
        setConnectionQuality("disconnected");
        toast({
          title: "Connection Error",
          description: "Failed to connect to audio sync server",
          variant: "destructive",
        });
      }
    };
    
    initializeClient();

    // Simulate connection quality and latency updates
    // Only update if we're connected and not too frequently
    const qualityInterval = setInterval(() => {
      if (isConnected) {
        // Update latency (10-100ms)
        setLatency(Math.floor(Math.random() * 90) + 10);
      }
    }, 10000); // Less frequent updates

    return () => {
      audioSyncClient.disconnect();
      clearInterval(qualityInterval);
    };
  }, [searchParams, toast]);

  // Save device name to localStorage
  useEffect(() => {
    if (typeof localStorage !== "undefined" && deviceName) {
      localStorage.setItem("deviceName", deviceName);
    }
  }, [deviceName]);

  const joinRoom = async () => {
    if (!roomCode) {
      toast({
        title: "Error",
        description: "Please enter a room code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const audioSyncClient = getAudioSyncClient();
      
      // First ensure we're connected to the WebSocket server
      if (!audioSyncClient.isConnected()) {
        console.log("WebSocket not connected, connecting now...");
        await audioSyncClient.connect("ws://localhost:8080/ws");
      }
      
      console.log("Attempting to join room with code:", roomCode);
      
      // Then join the room
      await audioSyncClient.joinRoom(roomCode, deviceName);
      
      // Explicitly update UI state on successful join
      console.log("Join room promise resolved, updating UI state");
      setIsConnected(true);
      setConnectionQuality("good");  // Set connection quality to good (lowercase to match type)
      setIsJoining(false);
      toast({
        title: "Connected to Room",
        description: `Successfully joined room ${roomCode}`,
      });
      
      // Still set a timeout just in case the UI doesn't update properly
      const timeout = setTimeout(() => {
        if (isJoining) {
          console.log("Join room timeout triggered, forcing UI update");
          setIsJoining(false);
          toast({
            title: "Error",
            description: "Join room request timed out",
            variant: "destructive",
          });
        }
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    } catch (error) {
      console.error("Failed to join room:", error);
      setIsJoining(false);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : (error as Error).message || "Failed to join room",
        variant: "destructive",
      });
    }
  };

  const leaveRoom = () => {
    try {
      const audioSyncClient = getAudioSyncClient();
      audioSyncClient.leaveRoom();
      setIsConnected(false);
    } catch (error) {
      console.error("Failed to leave room:", error);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);

    try {
      const audioSyncClient = getAudioSyncClient();
      audioSyncClient.setDeviceVolume(newVolume[0]);
    } catch (error) {
      console.error("Failed to update volume:", error);
    }
  };

  const getConnectionQualityText = () => {
    switch (connectionQuality) {
      case "good":
        return "Good";
      case "medium":
        return "Medium";
      case "poor":
        return "Poor";
      default:
        return "Disconnected";
    }
  };

  const getConnectionQualityColor = () => {
    switch (connectionQuality) {
      case "good":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "poor":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="container mx-auto py-8 bg-background">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 text-center">
        Audio Sync Client
      </h1>

      {!isConnected ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 mb-4 mx-auto">
              <Volume2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center">Join a Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Device Name</label>
              <Input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Enter your device name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Room Code</label>
              <Input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                className="uppercase"
                maxLength={6}
              />
            </div>
            <Button
              className="w-full"
              onClick={joinRoom}
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <Volume2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Audio Playback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-24 bg-card rounded-lg mb-6 overflow-hidden">
                <AudioVisualizer
                  isPlaying={isPlaying}
                  className="w-full h-full"
                />
              </div>
              {audioSource && (
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium">
                    Now playing: {(audioSource as any).sourceId || audioSource.type || 'Unknown'}
                  </p>
                </div>
              )}
              <AudioPlayer
                isHost={false}
                audioUrl={audioSource?.files?.[0] ? URL.createObjectURL(audioSource.files[0]) : undefined}
                audioStream={audioSource?.stream}
                externalPlayState={isPlaying}
                externalTimestamp={currentTimestamp}
                className="max-w-md mx-auto"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Room Code:</span>
                  <span className="text-lg font-bold tracking-widest">{roomCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Device Name:</span>
                  <span>{deviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Connection Quality:</span>
                  <span className={getConnectionQualityColor()}>
                    {getConnectionQualityText()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Latency:</span>
                  <span>{latency}ms</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Device Volume</label>
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

              <Button
                variant="outline"
                className="w-full"
                onClick={leaveRoom}
              >
                Leave Room
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
