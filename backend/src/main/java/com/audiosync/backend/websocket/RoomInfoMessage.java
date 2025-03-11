package com.audiosync.backend.websocket;

import com.audiosync.backend.model.AudioSource;
import lombok.Data;

@Data
public class RoomInfoMessage {
    private String roomId;
    private String roomCode;
    private boolean isPlaying;
    private long currentTimestamp;
    private int masterVolume;
    private AudioSource audioSource;
}
