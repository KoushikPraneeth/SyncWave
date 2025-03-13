"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Replace Lucide React icons with React Icons
import { FaMicrophone as Mic } from "react-icons/fa";
import { FaMusic as Music } from "react-icons/fa";
import { FaVolumeUp as Speaker } from "react-icons/fa";
import { FaPlay as Play } from "react-icons/fa";
import { FaPause as Pause } from "react-icons/fa";
import { FaForward as SkipForward } from "react-icons/fa";
import { FaVolumeDown as Volume2 } from "react-icons/fa";
import { FaSync as RefreshCw } from "react-icons/fa";
import { Slider } from "@/components/ui/slider";
import { QRCode } from "@/components/qr-code";
import { DeviceList } from "@/components/device-list";
import { AudioPlayer } from "@/components/audio-player";
import { getAudioSyncClient } from "@/lib/audio-sync-client";
import { AudioSource, SyncedDevice } from "@/lib/audio-sync";
import { useToast } from "@/components/ui/use-toast";

export default function HostPage() {
  const { toast } = useToast();
  const [roomCode, setRoomCode] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState([80]);
  const [selectedSource, setSelectedSource] = useState("files");
  const [connectedDevices, setConnectedDevices] = useState<SyncedDevice[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [audioSource, setAudioSource] = useState<AudioSource | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize audio sync client
  useEffect(() => {
    const audioSyncClient = getAudioSyncClient({
      onRoomJoined: (room) => {
        setRoomCode(room.code);
        setIsConnected(true);
        setIsCreatingRoom(false);
        toast({
          title: "Room Created",
          description: `Room code: ${room.code}`,
        });
      },
      onDeviceConnected: (device) => {
        setConnectedDevices((prev) => [...prev, device]);
        toast({
          title: "Device Connected",
          description: `${device.name} has joined the room`,
        });
      },
      onDeviceDisconnected: (deviceId) => {
        setConnectedDevices((prev) => prev.filter((d) => d.id !== deviceId));
      },
      onDeviceUpdated: (device) => {
        setConnectedDevices((prev) =>
          prev.map((d) => (d.id === device.id ? device : d)),
        );
      },
      onError: (error) => {
        console.error("Audio sync error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to audio sync server",
          variant: "destructive",
        });
      },
    });

    // Connect to WebSocket server
    audioSyncClient
      .connect("ws://localhost:8080/ws")
      .catch((error) => console.error("Failed to connect:", error));

    return () => {
      audioSyncClient.disconnect();
    };
  }, [toast]);

  const createRoom = async () => {
    setIsCreatingRoom(true);
    try {
      const audioSyncClient = getAudioSyncClient();
      const room = await audioSyncClient.createRoom();
      
      // Update local state with room information
      setRoomCode(room.code);
      setIsConnected(true);
      setIsCreatingRoom(false);
      
      toast({
        title: "Room Created",
        description: `Room code: ${room.code}`,
      });
      
      return room;
    } catch (error) {
      console.error("Failed to create room:", error);
      setIsCreatingRoom(false);
      toast({
        title: "Error",
        description: typeof error === 'string' ? error : (error as Error).message || "Failed to create room",
        variant: "destructive",
      });
      throw error; // Re-throw to allow handling in the useEffect
    }
  };

  useEffect(() => {
    const initializeRoom = async () => {
      try {
        // First ensure we're connected to the WebSocket server
        const audioSyncClient = getAudioSyncClient();
        await audioSyncClient.connect();
        
        // Then create the room
        await createRoom();
      } catch (error) {
        console.error("Failed to initialize room:", error);
        setIsCreatingRoom(false);
        toast({
          title: "Error",
          description: "Failed to initialize: " + (error as Error).message,
          variant: "destructive",
        });
      }
    };
    
    initializeRoom();
  }, []);

  const handlePlayPause = (playing: boolean, currentTime: number) => {
    setIsPlaying(playing);

    try {
      const audioSyncClient = getAudioSyncClient();
      audioSyncClient.setPlaybackState(playing, currentTime);
    } catch (error) {
      console.error("Failed to update playback state:", error);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume([newVolume]);

    try {
      const audioSyncClient = getAudioSyncClient();
      audioSyncClient.setMasterVolume(newVolume);
    } catch (error) {
      console.error("Failed to update volume:", error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const url = URL.createObjectURL(file);
    setAudioUrl(url);

    const newAudioSource: AudioSource = {
      type: "file",
      files: [file],
    };

    setAudioSource(newAudioSource);

    try {
      const audioSyncClient = getAudioSyncClient();
      audioSyncClient.setAudioSource(newAudioSource);
    } catch (error) {
      console.error("Failed to set audio source:", error);
    }
  };

  const handleMicrophoneAccess = async () => {
    try {
      // Check if the browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support microphone access");
      }
      
      // Request microphone access with specific constraints
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setAudioStream(stream);

      const newAudioSource: AudioSource = {
        type: "microphone",
        stream,
      };

      setAudioSource(newAudioSource);

      try {
        const audioSyncClient = getAudioSyncClient();
        audioSyncClient.setAudioSource(newAudioSource);
        
        // Start processing the audio stream for transmission
        if (audioSyncClient.processLiveAudioSource) {
          const stopProcessing = audioSyncClient.processLiveAudioSource(stream);
          // Store the stop function for cleanup
          return () => {
            stopProcessing();
            stream.getTracks().forEach(track => track.stop());
          };
        }
      } catch (error) {
        console.error("Failed to set audio source:", error);
        stream.getTracks().forEach(track => track.stop());
      }

      toast({
        title: "Microphone Access Granted",
        description: "You can now stream audio from your microphone",
      });
    } catch (error) {
      console.error("Failed to access microphone:", error);
      toast({
        title: "Microphone Access Denied",
        description: typeof error === 'object' && error !== null && 'message' in error ? 
          String(error.message) : "Please allow microphone access to use this feature",
        variant: "destructive",
      });
    }
  };

  const handleSystemAudioAccess = async () => {
    try {
      // This is a simplified version - actual system audio capture requires more complex setup
      // and may not be supported in all browsers
      toast({
        title: "System Audio Capture",
        description:
          "System audio capture is not fully implemented in this demo",
      });
    } catch (error) {
      console.error("Failed to access system audio:", error);
      toast({
        title: "System Audio Access Failed",
        description: "System audio capture is not supported in your browser",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 bg-background">
      <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-8 text-center">
        Audio Sync Host
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Audio Source</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={selectedSource}
              onValueChange={setSelectedSource}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="files" className="flex items-center gap-2">
                  <Music size={16} /> Files
                </TabsTrigger>
                <TabsTrigger
                  value="microphone"
                  className="flex items-center gap-2"
                >
                  <Mic size={16} /> Microphone
                </TabsTrigger>
                <TabsTrigger value="system" className="flex items-center gap-2">
                  <Speaker size={16} /> System Audio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="files" className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    Drop audio files here
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    or click to browse
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="audio/*"
                    className="hidden"
                  />
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Select Files
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="microphone">
                <div className="text-center p-8">
                  <Mic className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Use Microphone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stream audio from your microphone
                  </p>
                  <Button onClick={handleMicrophoneAccess}>
                    Grant Microphone Access
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="system">
                <div className="text-center p-8">
                  <Speaker className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">System Audio</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stream audio from your system
                  </p>
                  <Button onClick={handleSystemAudioAccess}>
                    Grant System Audio Access
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="mb-4 bg-white p-2 rounded-lg">
              <QRCode
                value={`https://modest-maxwell3-935yc.dev-2.tempolabs.ai/client?code=${roomCode}`}
                size={180}
              />
            </div>
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-1">Room Code:</p>
              <p className="text-2xl font-bold tracking-widest">{roomCode}</p>
            </div>
            <Button
              className="w-full"
              onClick={createRoom}
              disabled={isCreatingRoom}
            >
              {isCreatingRoom ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create New Room"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Playback Controls</CardTitle>
          </CardHeader>
          <CardContent>
            {audioSource?.files && audioSource.files.length > 0 && (
              <div className="mb-4 text-center">
                <p className="text-sm font-medium">
                  Now playing: {audioSource.files[0].name}
                </p>
              </div>
            )}
            <AudioPlayer
              audioUrl={audioUrl || undefined}
              audioStream={audioStream || undefined}
              isHost={true}
              onPlayPause={handlePlayPause}
              onVolumeChange={handleVolumeChange}
              className="max-w-md mx-auto"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceList
              devices={connectedDevices}
              onRemoveDevice={(deviceId) => {
                // In a real implementation, you would send a message to remove the device
                setConnectedDevices((prev) =>
                  prev.filter((d) => d.id !== deviceId),
                );
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
