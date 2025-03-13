package com.audiosync.backend.model;

import lombok.Data;

@Data
public class RoomDTO {
    private String id;
    private String code;
    private String hostId;
    private int connectedDevices;
    private boolean isPlaying;
    private int masterVolume;
    private AudioSource audioSource;
    
    public static RoomDTO fromRoom(Room room) {
        RoomDTO dto = new RoomDTO();
        dto.setId(room.getId());
        dto.setCode(room.getCode());
        dto.setHostId(room.getHostId());
        dto.setConnectedDevices(room.getDevices().size());
        dto.setPlaying(room.isPlaying());
        dto.setMasterVolume(room.getMasterVolume());
        dto.setAudioSource(room.getAudioSource());
        return dto;
    }
}
