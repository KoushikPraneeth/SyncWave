import { WebSocketClient, getWebSocketClient } from "./websocket-client";
import { AudioSource, Room, SyncedDevice } from "./audio-sync";

export interface AudioSyncOptions {
  onRoomJoined?: (room: Room) => void;
  onRoomLeft?: () => void;
  onPlaybackChanged?: (isPlaying: boolean, timestamp: number) => void;
  onVolumeChanged?: (volume: number) => void;
  onAudioSourceChanged?: (source: AudioSource) => void;
  onDeviceConnected?: (device: SyncedDevice) => void;
  onDeviceDisconnected?: (deviceId: string) => void;
  onDeviceUpdated?: (device: SyncedDevice) => void;
  onError?: (error: any) => void;
}

export class AudioSyncClient {
  private wsClient: WebSocketClient;
  private currentRoom: Room | null = null;
  private options: AudioSyncOptions;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private latencyCheckInterval: NodeJS.Timeout | null = null;

  constructor(options: AudioSyncOptions = {}) {
    this.options = options;
    this.wsClient = getWebSocketClient({
      onConnect: this.handleConnect.bind(this),
      onDisconnect: this.handleDisconnect.bind(this),
      onError: this.handleError.bind(this),
    });
  }

  public async connect(
    serverUrl: string = "ws://localhost:8080/ws",
  ): Promise<void> {
    try {
      await this.wsClient.connect(serverUrl);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  public disconnect(): void {
    this.leaveRoom();
    this.wsClient.disconnect();
  }

  public createRoom(): Promise<Room> {
    return new Promise((resolve, reject) => {
      // Simulate room creation
      setTimeout(() => {
        const room: Room = {
          id: "room-" + Math.random().toString(36).substring(2, 8),
          code: Math.random().toString(36).substring(2, 8).toUpperCase(),
          hostId: this.wsClient.getDeviceId(),
          devices: [],
          audioSource: null,
          isPlaying: false,
          masterVolume: 80,
        };

        this.currentRoom = room;
        this.setupRoomSubscriptions();
        resolve(room);
      }, 500);
    });
  }

  public joinRoom(
    roomCode: string,
    deviceName: string = "Unknown Device",
  ): void {
    if (!this.wsClient.isConnected()) {
      throw new Error("Not connected to WebSocket server");
    }

    this.wsClient.send("/app/join", {
      roomCode,
      deviceId: this.wsClient.getDeviceId(),
      deviceName,
    });
  }

  public leaveRoom(): void {
    if (this.currentRoom && this.wsClient.isConnected()) {
      this.wsClient.send("/app/leave", {
        roomId: this.currentRoom.id,
        deviceId: this.wsClient.getDeviceId(),
      });

      this.clearIntervals();
      this.currentRoom = null;

      if (this.options.onRoomLeft) {
        this.options.onRoomLeft();
      }
    }
  }

  public setPlaybackState(isPlaying: boolean, timestamp: number): void {
    if (!this.currentRoom || !this.wsClient.isConnected()) {
      throw new Error("Not in a room or not connected");
    }

    this.wsClient.send("/app/playback", {
      roomId: this.currentRoom.id,
      deviceId: this.wsClient.getDeviceId(),
      isPlaying,
      timestamp,
    });
  }

  public setMasterVolume(volume: number): void {
    if (!this.currentRoom || !this.wsClient.isConnected()) {
      throw new Error("Not in a room or not connected");
    }

    this.wsClient.send("/app/volume", {
      roomId: this.currentRoom.id,
      deviceId: this.wsClient.getDeviceId(),
      volume: Math.max(0, Math.min(100, volume)),
    });
  }

  public setDeviceVolume(volume: number): void {
    if (!this.currentRoom || !this.wsClient.isConnected()) {
      throw new Error("Not in a room or not connected");
    }

    this.wsClient.send("/app/volume", {
      roomId: this.currentRoom.id,
      deviceId: this.wsClient.getDeviceId(),
      targetDeviceId: this.wsClient.getDeviceId(),
      volume: Math.max(0, Math.min(100, volume)),
    });
  }

  public setAudioSource(source: AudioSource): void {
    if (!this.currentRoom || !this.wsClient.isConnected()) {
      throw new Error("Not in a room or not connected");
    }

    this.wsClient.send("/app/audio-source", {
      roomId: this.currentRoom.id,
      deviceId: this.wsClient.getDeviceId(),
      sourceType: source.type,
      sourceId: source.files?.[0]?.name || "",
      sourceUrl: "",
      duration: 0,
    });
  }

  public getCurrentRoom(): Room | null {
    return this.currentRoom;
  }

  private handleConnect(): void {
    console.log("Connected to AudioSync server");
  }

  private handleDisconnect(): void {
    console.log("Disconnected from AudioSync server");
    this.clearIntervals();
    this.currentRoom = null;

    if (this.options.onRoomLeft) {
      this.options.onRoomLeft();
    }
  }

  private handleError(error: any): void {
    console.error("AudioSync error:", error);
    if (this.options.onError) {
      this.options.onError(error);
    }
  }

  private setupRoomSubscriptions(): void {
    if (!this.currentRoom) return;

    // Subscribe to room info updates
    this.wsClient.subscribe("/user/topic/room", (message) => {
      this.currentRoom = message as Room;
      if (this.options.onRoomJoined) {
        this.options.onRoomJoined(this.currentRoom);
      }

      this.startHeartbeat();
      this.startLatencyCheck();
    });

    // Subscribe to playback updates
    this.wsClient.subscribe(
      `/topic/room/${this.currentRoom.id}/playback`,
      (message) => {
        if (this.options.onPlaybackChanged) {
          this.options.onPlaybackChanged(message.isPlaying, message.timestamp);
        }
      },
    );

    // Subscribe to volume updates
    this.wsClient.subscribe(
      `/topic/room/${this.currentRoom.id}/volume`,
      (message) => {
        if (this.options.onVolumeChanged) {
          this.options.onVolumeChanged(message.volume);
        }
      },
    );

    // Subscribe to individual volume updates
    this.wsClient.subscribe("/user/topic/volume", (message) => {
      if (this.options.onVolumeChanged) {
        this.options.onVolumeChanged(message.volume);
      }
    });

    // Subscribe to audio source updates
    this.wsClient.subscribe(
      `/topic/room/${this.currentRoom.id}/audio-source`,
      (message) => {
        if (this.options.onAudioSourceChanged) {
          const audioSource: AudioSource = {
            type: message.sourceType,
            stream: undefined,
            files: message.sourceId
              ? [new File([], message.sourceId)]
              : undefined,
          };
          this.options.onAudioSourceChanged(audioSource);
        }
      },
    );

    // If host, subscribe to device updates
    if (this.currentRoom.hostId === this.wsClient.getDeviceId()) {
      this.wsClient.subscribe("/user/topic/devices", (message) => {
        if (message.action === "JOIN" || message.action === "UPDATE") {
          const device: SyncedDevice = {
            id: message.deviceId,
            name: message.deviceName,
            connectionQuality: message.connectionQuality,
            latency: message.latency,
            volume: message.volume,
          };

          if (message.action === "JOIN" && this.options.onDeviceConnected) {
            this.options.onDeviceConnected(device);
          } else if (
            message.action === "UPDATE" &&
            this.options.onDeviceUpdated
          ) {
            this.options.onDeviceUpdated(device);
          }
        } else if (
          message.action === "LEAVE" &&
          this.options.onDeviceDisconnected
        ) {
          this.options.onDeviceDisconnected(message.deviceId);
        }
      });
    }
  }

  private startHeartbeat(): void {
    this.clearHeartbeatInterval();

    this.heartbeatInterval = setInterval(() => {
      if (this.currentRoom && this.wsClient.isConnected()) {
        this.wsClient.send("/app/heartbeat", {
          roomId: this.currentRoom.id,
          deviceId: this.wsClient.getDeviceId(),
          timestamp: Date.now(),
        });
      }
    }, 5000); // Send heartbeat every 5 seconds
  }

  private startLatencyCheck(): void {
    this.clearLatencyCheckInterval();

    this.latencyCheckInterval = setInterval(() => {
      if (this.currentRoom && this.wsClient.isConnected()) {
        const startTime = Date.now();

        // Simulate latency check
        setTimeout(() => {
          const latency = Math.floor(Math.random() * 50) + 10; // Random latency between 10-60ms

          this.wsClient.send("/app/latency", {
            roomId: this.currentRoom?.id,
            deviceId: this.wsClient.getDeviceId(),
            latency,
          });
        }, 100);
      }
    }, 10000); // Check latency every 10 seconds
  }

  private clearHeartbeatInterval(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private clearLatencyCheckInterval(): void {
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }
  }

  private clearIntervals(): void {
    this.clearHeartbeatInterval();
    this.clearLatencyCheckInterval();
  }
}

// Create a singleton instance
let instance: AudioSyncClient | null = null;

export function getAudioSyncClient(
  options?: AudioSyncOptions,
): AudioSyncClient {
  if (!instance) {
    instance = new AudioSyncClient(options);
  }
  return instance;
}
