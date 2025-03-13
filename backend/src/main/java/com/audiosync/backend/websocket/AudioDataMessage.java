package com.audiosync.backend.websocket;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AudioDataMessage {
    private String roomId;
    private String deviceId;
    private byte[] audioData;
    private long timestamp;
    private int sampleRate;
    private int channels;
    private String encoding; // e.g., "PCM", "MP3", etc.
    
    public String getRoomId() {
        return roomId;
    }
    
    public String getDeviceId() {
        return deviceId;
    }
    
    public byte[] getAudioData() {
        return audioData;
    }
    
    public long getTimestamp() {
        return timestamp;
    }
    
    public int getSampleRate() {
        return sampleRate;
    }
    
    public int getChannels() {
        return channels;
    }
    
    public String getEncoding() {
        return encoding;
    }
}
