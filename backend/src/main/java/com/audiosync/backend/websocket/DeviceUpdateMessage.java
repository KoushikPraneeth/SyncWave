package com.audiosync.backend.websocket;

import com.audiosync.backend.model.ConnectionQuality;
import lombok.Data;

@Data
public class DeviceUpdateMessage {
    private String deviceId;
    private String deviceName;
    private ConnectionQuality connectionQuality;
    private int latency;
    private int volume;
    private String action; // JOIN, LEAVE, UPDATE
}
