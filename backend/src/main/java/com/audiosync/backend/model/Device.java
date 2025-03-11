package com.audiosync.backend.model;

import lombok.Data;

@Data
public class Device {
    private String id;
    private String name;
    private ConnectionQuality connectionQuality;
    private int latency;
    private int volume;
    private long lastHeartbeat;

    public Device(String id, String name) {
        this.id = id;
        this.name = name;
        this.connectionQuality = ConnectionQuality.GOOD;
        this.latency = 0;
        this.volume = 70;
        this.lastHeartbeat = System.currentTimeMillis();
    }

    public void updateHeartbeat() {
        this.lastHeartbeat = System.currentTimeMillis();
    }

    public void updateLatency(int latency) {
        this.latency = latency;
        updateConnectionQuality();
    }

    private void updateConnectionQuality() {
        if (latency < 50) {
            this.connectionQuality = ConnectionQuality.GOOD;
        } else if (latency < 150) {
            this.connectionQuality = ConnectionQuality.MEDIUM;
        } else {
            this.connectionQuality = ConnectionQuality.POOR;
        }
    }

    public boolean isActive() {
        return System.currentTimeMillis() - lastHeartbeat < 10000; // 10 seconds timeout
    }
}
