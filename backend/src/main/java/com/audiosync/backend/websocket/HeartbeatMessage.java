package com.audiosync.backend.websocket;

import lombok.Data;

@Data
public class HeartbeatMessage {
    private String roomId;
    private String deviceId;
    private long timestamp;
}
