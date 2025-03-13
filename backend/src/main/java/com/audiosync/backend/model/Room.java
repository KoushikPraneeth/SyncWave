package com.audiosync.backend.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Getter
@Setter
public class Room {
    private String id;
    private String code;
    private String hostId;
    private List<Device> devices;
    private AudioSource audioSource;
    private boolean isPlaying;
    private int masterVolume;
    private long currentTimestamp;
    private long lastUpdateTime;

    public Room(String hostId) {
        this.id = UUID.randomUUID().toString();
        this.code = generateRoomCode();
        this.hostId = hostId;
        this.devices = new ArrayList<>();
        this.audioSource = null;
        this.isPlaying = false;
        this.masterVolume = 80;
        this.currentTimestamp = 0;
        this.lastUpdateTime = System.currentTimeMillis();
    }

    private String generateRoomCode() {
        // Generate a simpler, more readable room code (6 characters, alphanumeric)
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed similar looking characters
        StringBuilder code = new StringBuilder();
        java.util.Random random = new java.util.Random();
        
        for (int i = 0; i < 6; i++) {
            code.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        return code.toString();
    }

    public void addDevice(Device device) {
        this.devices.add(device);
    }

    public void removeDevice(String deviceId) {
        this.devices.removeIf(device -> device.getId().equals(deviceId));
    }

    public Device getDevice(String deviceId) {
        return this.devices.stream()
                .filter(device -> device.getId().equals(deviceId))
                .findFirst()
                .orElse(null);
    }
    
    public String getHostId() {
        return this.hostId;
    }
    
    public String getId() {
        return this.id;
    }

    public void updatePlaybackTime(long timestamp) {
        this.currentTimestamp = timestamp;
        this.lastUpdateTime = System.currentTimeMillis();
    }

    public long getCurrentPlaybackTime() {
        if (isPlaying) {
            return currentTimestamp + (System.currentTimeMillis() - lastUpdateTime);
        }
        return currentTimestamp;
    }
}
