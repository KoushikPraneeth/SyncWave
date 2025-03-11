package com.audiosync.backend.websocket;

import lombok.Data;

@Data
public class LatencyMessage {
    private String roomId;
    private String deviceId;
    private int latency;
}
