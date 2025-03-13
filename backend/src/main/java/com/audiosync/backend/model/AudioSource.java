package com.audiosync.backend.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;

@Data
@Getter
@Setter
public class AudioSource {
    private AudioSourceType type;
    private String sourceId;
    private String sourceUrl;
    private long duration;

    public enum AudioSourceType {
        FILE,
        MICROPHONE,
        SYSTEM
    }
}
