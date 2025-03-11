// Using a simpler implementation without external dependencies
// since we're having issues with @stomp/stompjs

type MessageCallback = (message: any) => void;

export interface WebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

// Generate a UUID v4 (simplified version)
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface WebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
}

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private deviceId: string;
  private subscriptions: { [key: string]: MessageCallback } = {};
  private topicSubscriptions: {
    [key: string]: { [id: string]: MessageCallback };
  } = {};
  private connected = false;
  private options: WebSocketOptions;

  constructor(options: WebSocketOptions = {}) {
    this.deviceId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("deviceId") || generateUUID()
        : generateUUID();

    if (typeof localStorage !== "undefined") {
      localStorage.setItem("deviceId", this.deviceId);
    }

    this.options = options;
  }

  public connect(url: string = "ws://localhost:8080/ws"): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For demo purposes, we'll simulate a successful connection
        // In a real implementation, you would connect to a WebSocket server
        console.log("Simulating WebSocket connection to", url);

        // Simulate successful connection after a short delay
        setTimeout(() => {
          this.connected = true;
          if (this.options.onConnect) {
            this.options.onConnect();
          }
          resolve();
        }, 500);
      } catch (error) {
        console.error("Error connecting to WebSocket server", error);
        if (this.options.onError) {
          this.options.onError(error);
        }
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connected = false;
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }
  }

  public subscribe(destination: string, callback: MessageCallback): string {
    // For demo purposes, we'll just store the callback
    const subscriptionId = generateUUID();

    // Parse the destination to determine if it's a topic subscription
    if (destination.startsWith("/topic/")) {
      const topic = destination.substring(7);
      if (!this.topicSubscriptions[topic]) {
        this.topicSubscriptions[topic] = {};
      }
      this.topicSubscriptions[topic][subscriptionId] = callback;
    } else {
      this.subscriptions[subscriptionId] = callback;
    }

    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): void {
    // Remove from regular subscriptions
    if (this.subscriptions[subscriptionId]) {
      delete this.subscriptions[subscriptionId];
      return;
    }

    // Check topic subscriptions
    for (const topic in this.topicSubscriptions) {
      if (this.topicSubscriptions[topic][subscriptionId]) {
        delete this.topicSubscriptions[topic][subscriptionId];
        return;
      }
    }
  }

  public send(destination: string, body: any): void {
    console.log(`Simulating sending message to ${destination}:`, body);

    // For demo purposes, we'll simulate responses for certain messages
    if (destination === "/app/join") {
      // Simulate room join response
      setTimeout(() => {
        const roomInfo = {
          id: generateUUID(),
          code: body.roomCode || "DEMO123",
          hostId: this.deviceId,
          isPlaying: false,
          currentTimestamp: 0,
          masterVolume: 80,
          audioSource: null,
        };

        // Find the callback for user topic room
        const callback = this.subscriptions["/user/topic/room"];
        if (callback) {
          callback(roomInfo);
        }
      }, 300);
    }
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

// Create a singleton instance
let instance: WebSocketClient | null = null;

export function getWebSocketClient(
  options?: WebSocketOptions,
): WebSocketClient {
  if (!instance) {
    instance = new WebSocketClient(options);
  }
  return instance;
}
