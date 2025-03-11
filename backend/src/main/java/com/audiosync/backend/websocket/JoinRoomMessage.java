package com.audiosync.backend.websocket;

import lombok.Data;

@Data
public class JoinRoomMessage {
    private String roomCode;
    private String deviceId;
    private String deviceName;
}
