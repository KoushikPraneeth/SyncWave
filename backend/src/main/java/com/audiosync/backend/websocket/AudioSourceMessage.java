package com.audiosync.backend.websocket;

import com.audiosync.backend.model.AudioSource.AudioSourceType;
import lombok.Data;

@Data
public class AudioSourceMessage {
    private String roomId;
    private String deviceId;
    private AudioSourceType sourceType;
    private String sourceId;
    private String sourceUrl;
    private long duration;
}
