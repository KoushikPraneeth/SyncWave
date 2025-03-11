// This file will contain the core audio synchronization logic

// Types for our audio sync system
export interface AudioSource {
  type: "file" | "microphone" | "system";
  stream?: MediaStream;
  files?: File[];
}

export interface SyncedDevice {
  id: string;
  name: string;
  connectionQuality: "good" | "medium" | "poor" | "disconnected";
  latency: number; // in milliseconds
  volume: number; // 0-100
}

export interface Room {
  id: string;
  code: string;
  hostId: string;
  devices: SyncedDevice[];
  audioSource: AudioSource | null;
  isPlaying: boolean;
  masterVolume: number; // 0-100
}

// In a real implementation, this would use WebRTC, WebSockets, or a similar technology
// for real-time communication between devices

export class AudioSyncManager {
  private rooms: Map<string, Room> = new Map();

  // Create a new room and return the room code
  createRoom(hostId: string): string {
    const roomCode = this.generateRoomCode();
    const roomId = crypto.randomUUID();

    const room: Room = {
      id: roomId,
      code: roomCode,
      hostId,
      devices: [],
      audioSource: null,
      isPlaying: false,
      masterVolume: 80,
    };

    this.rooms.set(roomId, room);
    return roomCode;
  }

  // Join an existing room
  joinRoom(
    roomCode: string,
    deviceId: string,
    deviceName: string,
  ): SyncedDevice | null {
    // Find room by code
    const room = Array.from(this.rooms.values()).find(
      (r) => r.code === roomCode,
    );
    if (!room) return null;

    // Create device object
    const device: SyncedDevice = {
      id: deviceId,
      name: deviceName,
      connectionQuality: "good",
      latency: 0,
      volume: 70,
    };

    // Add device to room
    room.devices.push(device);
    return device;
  }

  // Set audio source for a room
  setAudioSource(roomId: string, source: AudioSource): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.audioSource = source;
    return true;
  }

  // Control playback
  setPlaybackState(roomId: string, isPlaying: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.isPlaying = isPlaying;
    return true;
  }

  // Set master volume
  setMasterVolume(roomId: string, volume: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    room.masterVolume = Math.max(0, Math.min(100, volume));
    return true;
  }

  // Set device volume
  setDeviceVolume(roomId: string, deviceId: string, volume: number): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const device = room.devices.find((d) => d.id === deviceId);
    if (!device) return false;

    device.volume = Math.max(0, Math.min(100, volume));
    return true;
  }

  // Remove device from room
  removeDevice(roomId: string, deviceId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    const deviceIndex = room.devices.findIndex((d) => d.id === deviceId);
    if (deviceIndex === -1) return false;

    room.devices.splice(deviceIndex, 1);
    return true;
  }

  // Generate a random room code
  private generateRoomCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}

// Create a singleton instance
export const audioSyncManager = new AudioSyncManager();
