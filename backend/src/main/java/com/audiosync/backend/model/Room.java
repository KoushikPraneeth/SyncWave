package com.audiosync.backend.model;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
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
        return UUID.randomUUID().toString().substring(0, 6).toUpperCase();
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
