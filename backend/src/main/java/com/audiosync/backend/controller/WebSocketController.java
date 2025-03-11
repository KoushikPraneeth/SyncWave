package com.audiosync.backend.controller;

import com.audiosync.backend.model.AudioSource;
import com.audiosync.backend.model.Device;
import com.audiosync.backend.model.Room;
import com.audiosync.backend.service.RoomService;
import com.audiosync.backend.websocket.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Optional;

@Controller
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final RoomService roomService;

    @Autowired
    public WebSocketController(SimpMessagingTemplate messagingTemplate, RoomService roomService) {
        this.messagingTemplate = messagingTemplate;
        this.roomService = roomService;
    }

    @MessageMapping("/join")
    public void joinRoom(@Payload JoinRoomMessage message) {
        Optional<Room> roomOpt = roomService.getRoomByCode(message.getRoomCode());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            Device device = roomService.addDeviceToRoom(room.getId(), message.getDeviceId(), message.getDeviceName());
            
            // Send room info to the joining device
            RoomInfoMessage roomInfo = new RoomInfoMessage();
            roomInfo.setRoomId(room.getId());
            roomInfo.setRoomCode(room.getCode());
            roomInfo.setIsPlaying(room.isPlaying());
            roomInfo.setCurrentTimestamp(room.getCurrentPlaybackTime());
            roomInfo.setMasterVolume(room.getMasterVolume());
            roomInfo.setAudioSource(room.getAudioSource());
            
            messagingTemplate.convertAndSendToUser(message.getDeviceId(), "/topic/room", roomInfo);
            
            // Notify host about new device
            DeviceUpdateMessage deviceUpdate = new DeviceUpdateMessage();
            deviceUpdate.setDeviceId(device.getId());
            deviceUpdate.setDeviceName(device.getName());
            deviceUpdate.setConnectionQuality(device.getConnectionQuality());
            deviceUpdate.setLatency(device.getLatency());
            deviceUpdate.setVolume(device.getVolume());
            deviceUpdate.setAction("JOIN");
            
            messagingTemplate.convertAndSendToUser(room.getHostId(), "/topic/devices", deviceUpdate);
        }
    }

    @MessageMapping("/leave")
    public void leaveRoom(@Payload LeaveRoomMessage message) {
        Optional<Room> roomOpt = roomService.getRoomById(message.getRoomId());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            roomService.removeDeviceFromRoom(room.getId(), message.getDeviceId());
            
            // Notify host about device leaving
            DeviceUpdateMessage deviceUpdate = new DeviceUpdateMessage();
            deviceUpdate.setDeviceId(message.getDeviceId());
            deviceUpdate.setAction("LEAVE");
            
            messagingTemplate.convertAndSendToUser(room.getHostId(), "/topic/devices", deviceUpdate);
        }
    }

    @MessageMapping("/playback")
    public void updatePlayback(@Payload PlaybackControlMessage message) {
        Optional<Room> roomOpt = roomService.getRoomById(message.getRoomId());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            
            // Only host can control playback
            if (message.getDeviceId().equals(room.getHostId())) {
                roomService.setPlaybackState(room.getId(), message.isPlaying(), message.getTimestamp());
                
                // Broadcast to all devices in the room
                messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/playback", message);
            }
        }
    }

    @MessageMapping("/volume")
    public void updateVolume(@Payload VolumeControlMessage message) {
        Optional<Room> roomOpt = roomService.getRoomById(message.getRoomId());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            
            if (message.getTargetDeviceId() == null) {
                // Master volume update (host only)
                if (message.getDeviceId().equals(room.getHostId())) {
                    roomService.setMasterVolume(room.getId(), message.getVolume());
                    messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/volume", message);
                }
            } else {
                // Individual device volume update
                if (message.getDeviceId().equals(message.getTargetDeviceId()) || 
                    message.getDeviceId().equals(room.getHostId())) {
                    roomService.setDeviceVolume(room.getId(), message.getTargetDeviceId(), message.getVolume());
                    
                    // If host changed a device's volume, notify that device
                    if (message.getDeviceId().equals(room.getHostId())) {
                        messagingTemplate.convertAndSendToUser(
                            message.getTargetDeviceId(), 
                            "/topic/volume", 
                            message
                        );
                    }
                }
            }
        }
    }

    @MessageMapping("/audio-source")
    public void setAudioSource(@Payload AudioSourceMessage message) {
        Optional<Room> roomOpt = roomService.getRoomById(message.getRoomId());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            
            // Only host can set audio source
            if (message.getDeviceId().equals(room.getHostId())) {
                AudioSource audioSource = new AudioSource();
                audioSource.setType(message.getSourceType());
                audioSource.setSourceId(message.getSourceId());
                audioSource.setSourceUrl(message.getSourceUrl());
                audioSource.setDuration(message.getDuration());
                
                roomService.setAudioSource(room.getId(), audioSource);
                
                // Broadcast to all devices in the room
                messagingTemplate.convertAndSend("/topic/room/" + room.getId() + "/audio-source", message);
            }
        }
    }

    @MessageMapping("/latency")
    public void updateLatency(@Payload LatencyMessage message) {
        Optional<Room> roomOpt = roomService.getRoomById(message.getRoomId());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            roomService.updateDeviceLatency(room.getId(), message.getDeviceId(), message.getLatency());
            
            // Notify host about updated latency
            Device device = room.getDevice(message.getDeviceId());
            if (device != null) {
                DeviceUpdateMessage deviceUpdate = new DeviceUpdateMessage();
                deviceUpdate.setDeviceId(device.getId());
                deviceUpdate.setConnectionQuality(device.getConnectionQuality());
                deviceUpdate.setLatency(device.getLatency());
                deviceUpdate.setAction("UPDATE");
                
                messagingTemplate.convertAndSendToUser(room.getHostId(), "/topic/devices", deviceUpdate);
            }
        }
    }

    @MessageMapping("/heartbeat")
    public void heartbeat(@Payload HeartbeatMessage message) {
        Optional<Room> roomOpt = roomService.getRoomById(message.getRoomId());
        
        if (roomOpt.isPresent()) {
            Room room = roomOpt.get();
            roomService.updateDeviceHeartbeat(room.getId(), message.getDeviceId());
        }
    }
}
