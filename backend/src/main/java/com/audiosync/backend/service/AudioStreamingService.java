package com.audiosync.backend.service;

import com.audiosync.backend.model.Device;
import com.audiosync.backend.model.Room;
import com.audiosync.backend.websocket.AudioDataMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AudioStreamingService {
    private static final Logger logger = LoggerFactory.getLogger(AudioStreamingService.class);
    
    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;
    
    // Store the latest audio chunk timestamp for each room
    private final Map<String, Long> roomLastAudioTimestamp = new ConcurrentHashMap<>();
    
    // Store buffer size for each device (in ms) for latency compensation
    private final Map<String, Integer> deviceBufferSizes = new ConcurrentHashMap<>();
    
    @Autowired
    public AudioStreamingService(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }
    
    /**
     * Process incoming audio data from the host and broadcast to clients
     * @param message The audio data message
     */
    public void processAudioData(AudioDataMessage message) {
        String roomId = message.getRoomId();
        Optional<Room> roomOpt = roomService.getRoomById(roomId);
        
        if (roomOpt.isEmpty()) {
            logger.warn("Received audio data for non-existent room: {}", roomId);
            return;
        }
        
        Room room = roomOpt.get();
        
        // Only the host can send audio data
        if (!message.getDeviceId().equals(room.getHostId())) {
            logger.warn("Non-host device attempted to send audio data: {}", message.getDeviceId());
            return;
        }
        
        // Update the last audio timestamp for this room
        roomLastAudioTimestamp.put(roomId, message.getTimestamp());
        
        // Broadcast to all clients in the room with latency compensation
        for (Device device : room.getDevices()) {
            // Skip the host
            if (device.getId().equals(room.getHostId())) {
                continue;
            }
            
            // Get or calculate buffer size for this device based on latency
            int bufferSize = calculateBufferSize(device);
            deviceBufferSizes.put(device.getId(), bufferSize);
            
            // Create a copy of the message with device-specific metadata
            AudioDataMessage deviceMessage = new AudioDataMessage();
            deviceMessage.setRoomId(roomId);
            deviceMessage.setDeviceId(message.getDeviceId());
            deviceMessage.setAudioData(message.getAudioData());
            deviceMessage.setTimestamp(message.getTimestamp());
            deviceMessage.setSampleRate(message.getSampleRate());
            deviceMessage.setChannels(message.getChannels());
            deviceMessage.setEncoding(message.getEncoding());
            
            // Send to the specific device
            messagingTemplate.convertAndSendToUser(
                device.getId(),
                "/topic/audio",
                deviceMessage
            );
        }
    }
    
    /**
     * Calculate appropriate buffer size based on device latency
     * @param device The client device
     * @return Buffer size in milliseconds
     */
    private int calculateBufferSize(Device device) {
        // Base buffer size
        int baseBuffer = 200; // 200ms base buffer
        
        // Add additional buffer based on latency and jitter
        int latencyBuffer = (int) (device.getLatency() * 1.5); // 1.5x the measured latency
        
        // Calculate connection quality factor (0.8 to 2.0)
        double qualityFactor;
        switch (device.getConnectionQuality()) {
            case GOOD:
                qualityFactor = 0.8;
                break;
            case MEDIUM:
                qualityFactor = 1.3;
                break;
            case POOR:
                qualityFactor = 1.7;
                break;
            case DISCONNECTED:
                qualityFactor = 2.0;
                break;
            default: // unknown
                qualityFactor = 2.0;
        }
        
        // Calculate final buffer size
        return (int) ((baseBuffer + latencyBuffer) * qualityFactor);
    }
    
    /**
     * Get the current buffer size for a device
     * @param deviceId The device ID
     * @return Buffer size in milliseconds, or default if not set
     */
    public int getDeviceBufferSize(String deviceId) {
        return deviceBufferSizes.getOrDefault(deviceId, 300); // Default 300ms
    }
    
    /**
     * Update the audio playback state for a room
     * @param roomId The room ID
     * @param isPlaying Whether playback is active
     */
    public void updatePlaybackState(String roomId, boolean isPlaying) {
        // Reset timestamps if playback is starting
        if (isPlaying) {
            roomLastAudioTimestamp.put(roomId, System.currentTimeMillis());
        }
    }
    
    /**
     * Clean up resources for a room when it's removed
     * @param roomId The room ID to clean up
     */
    public void cleanupRoom(String roomId) {
        roomLastAudioTimestamp.remove(roomId);
    }
}
