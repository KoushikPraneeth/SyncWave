package com.audiosync.backend.websocket;

import lombok.Data;

@Data
public class PlaybackControlMessage {
    private String roomId;
    private String deviceId;
    private boolean isPlaying;
    private long timestamp;
}
