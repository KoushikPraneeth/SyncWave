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
  private messageListeners: MessageCallback[] = [];
  private connected = false;
  private options: WebSocketOptions;
  // Store the current audio source for reference
  private currentAudioSource: any = null;

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

  public connect(url: string = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8080/ws`): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      try {
        this.socket = new WebSocket(url);

        this.socket.onopen = () => {
          console.log("WebSocket connected to", url);
          this.connected = true;
          if (this.options.onConnect) {
            this.options.onConnect();
          }
          resolve();
        };

        this.socket.onclose = () => {
          console.log("WebSocket disconnected");
          this.connected = false;
          this.socket = null;
          if (this.options.onDisconnect) {
            this.options.onDisconnect();
          }
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log("Received message:", message);

            // Notify all message listeners first
            if (this.messageListeners.length > 0) {
              this.messageListeners.forEach((listener) => {
                try {
                  listener(message);
                } catch (error) {
                  console.error("Error in message listener:", error);
                }
              });
            }

            // Handle topic-based subscriptions
            if (message.type) {
              const topic = message.type.toLowerCase().replace(/_/g, '-'); // Normalize topic
              if (this.topicSubscriptions[topic]) {
                Object.values(this.topicSubscriptions[topic]).forEach(callback => {
                  try {
                    callback(message);
                  } catch (error) {
                    console.error(`Error in topic subscription callback for ${topic}:`, error);
                  }
                });
              }
            }
             // Handle regular subscriptions (for user-specific topics)
             for (const subscriptionId in this.subscriptions) {
              try {
                this.subscriptions[subscriptionId](message); // Call each subscription callback
              } catch (error) {
                console.error(`Error in subscription ${subscriptionId} callback:`, error);
              }
            }


          } catch (error) {
            console.error("Error parsing message:", error);
            if (this.options.onError) {
              this.options.onError(error);
            }
          }
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          this.connected = false;
          this.socket = null;
          if (this.options.onError) {
            this.options.onError(error);
          }
          reject(error);
        };
      } catch (error) {
        console.error("Error creating WebSocket client", error);
        if (this.options.onError) {
          this.options.onError(error);
        }
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
    this.connected = false;
    this.socket = null;
    if (this.options.onDisconnect) {
      this.options.onDisconnect();
    }
  }

  public subscribe(destination: string, callback: MessageCallback): string {
    const subscriptionId = generateUUID();

    // Parse the destination to determine if it's a topic subscription
    if (destination.startsWith("/topic/")) {
      const topic = destination.substring(7);
      if (!this.topicSubscriptions[topic]) {
        this.topicSubscriptions[topic] = {};
      }
      this.topicSubscriptions[topic][subscriptionId] = callback;
    } else if (destination.startsWith("/user/topic/")) {
      this.subscriptions[subscriptionId] = callback;
    } else {
      console.warn("Invalid destination format:", destination);
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
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        ...body,
        type: destination.substring(destination.lastIndexOf('/') + 1).toUpperCase() // Infer message type from destination
      };
      const jsonMessage = JSON.stringify(message);
      console.log(`Sending message to ${destination}:`, jsonMessage);
      this.socket.send(jsonMessage);
    } else {
      console.error("WebSocket is not connected. Cannot send message to", destination);
    }
  }


  public getDeviceId(): string {
    return this.deviceId;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  public addMessageListener(callback: MessageCallback): void {
    console.log("Adding message listener, current count:", this.messageListeners.length);
    this.messageListeners.push(callback);
  }

  public removeMessageListener(callback: MessageCallback): void {
    console.log("Attempting to remove message listener, current count:", this.messageListeners.length);
    const index = this.messageListeners.indexOf(callback);
    if (index !== -1) {
      this.messageListeners.splice(index, 1);
      console.log("Message listener removed, new count:", this.messageListeners.length);
    } else {
      console.warn("Could not find message listener to remove");
    }
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
