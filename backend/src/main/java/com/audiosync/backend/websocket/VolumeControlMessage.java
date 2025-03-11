package com.audiosync.backend.websocket;

import lombok.Data;

@Data
public class VolumeControlMessage {
    private String roomId;
    private String deviceId;
    private String targetDeviceId; // null for master volume
    private int volume;
}
