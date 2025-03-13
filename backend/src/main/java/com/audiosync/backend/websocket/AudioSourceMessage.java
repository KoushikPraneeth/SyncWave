package com.audiosync.backend.websocket;

import com.audiosync.backend.model.AudioSource.AudioSourceType;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AudioSourceMessage {
    private String roomId;
    private String deviceId;
    private AudioSourceType sourceType;
    private String sourceId;
    private String sourceUrl;
    private long duration;
    
    public String getRoomId() {
        return roomId;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public AudioSourceType getSourceType() {
        return sourceType;
    }
    
    public String getSourceId() {
        return sourceId;
    }
    
    public String getSourceUrl() {
        return sourceUrl;
    }
    
    public long getDuration() {
        return duration;
    }
}
