package com.audiosync.backend.websocket;

import lombok.Data;

@Data
public class LeaveRoomMessage {
    private String roomId;
    private String deviceId;
}
