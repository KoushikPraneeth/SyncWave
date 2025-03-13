# SyncWave

SyncWave is a web application that transforms multiple devices into a synchronized sound system, allowing a host to stream audio to connected client devices with perfect timing alignment.

## Features

### Host Dashboard
- Clean interface with audio source selector (local files, microphone, system audio)
- Room creation with automatically generated room code
- Prominently displayed QR code for easy joining
- Master volume control affecting all connected devices
- Playback controls (play/pause) synchronized across all devices
- Connected device management with connection quality indicators

### Client View
- Minimalist connection screen with room code entry
- Device name customization
- Playback controls synchronized with host
- Individual volume slider for client-side adjustments
- Connection quality and latency monitoring

### Audio Synchronization
- Real-time audio streaming from host to clients
- Automatic latency compensation
- Connection quality monitoring
- Elegant waveform visualization showing real-time audio levels

## Technology Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS, shadcn/ui components
- **Backend**: Java Spring Boot with WebSocket support
- **Audio Processing**: Web Audio API
- **Real-time Communication**: WebSockets with STOMP protocol

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Java 17 or higher (for backend)
- Maven (for backend)

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/SyncWave.git
   cd SyncWave
   ```

2. Install frontend dependencies
   ```
   npm install
   ```

3. Build and run the backend
   ```
   cd backend
   mvn spring-boot:run
   ```

4. Start the frontend development server
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000`

## Usage

### Hosting a Room

1. Navigate to the Host page
2. Select an audio source (file, microphone, or system audio)
3. A room code and QR code will be automatically generated
4. Share the room code or QR code with others to join
5. Control playback and volume from the host interface

### Joining a Room

1. Navigate to the Client page
2. Enter the room code provided by the host
3. Customize your device name (optional)
4. Click 'Join Room'
5. Once connected, you'll hear synchronized audio from the host

## Project Structure

```
/
├── backend/             # Java Spring Boot backend
│   └── src/            # Backend source code
├── src/                # Frontend source code
│   ├── app/            # Next.js app router pages
│   ├── components/     # React components
│   └── lib/            # Utility functions and libraries
├── public/             # Static assets
└── package.json        # Project dependencies
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.