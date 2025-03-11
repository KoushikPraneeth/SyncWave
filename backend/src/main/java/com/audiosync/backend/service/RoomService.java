package com.audiosync.backend.service;

import com.audiosync.backend.model.AudioSource;
import com.audiosync.backend.model.ConnectionQuality;
import com.audiosync.backend.model.Device;
import com.audiosync.backend.model.Room;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class RoomService {

    private final Map<String, Room> rooms = new ConcurrentHashMap<>();
    private final Map<String, String> roomCodeToId = new ConcurrentHashMap<>();

    public Room createRoom(String hostId) {
        Room room = new Room(hostId);
        rooms.put(room.getId(), room);
        roomCodeToId.put(room.getCode(), room.getId());
        return room;
    }

    public Optional<Room> getRoomByCode(String code) {
        String roomId = roomCodeToId.get(code);
        if (roomId == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(rooms.get(roomId));
    }

    public Optional<Room> getRoomById(String roomId) {
        return Optional.ofNullable(rooms.get(roomId));
    }

    public Device addDeviceToRoom(String roomId, String deviceId, String deviceName) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return null;
        }

        Device device = new Device(deviceId, deviceName);
        room.addDevice(device);
        return device;
    }

    public boolean removeDeviceFromRoom(String roomId, String deviceId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        room.removeDevice(deviceId);
        return true;
    }

    public boolean setAudioSource(String roomId, AudioSource audioSource) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        room.setAudioSource(audioSource);
        return true;
    }

    public boolean setPlaybackState(String roomId, boolean isPlaying, long timestamp) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        room.setPlaying(isPlaying);
        room.updatePlaybackTime(timestamp);
        return true;
    }

    public boolean setMasterVolume(String roomId, int volume) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        room.setMasterVolume(Math.max(0, Math.min(100, volume)));
        return true;
    }

    public boolean setDeviceVolume(String roomId, String deviceId, int volume) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        Device device = room.getDevice(deviceId);
        if (device == null) {
            return false;
        }

        device.setVolume(Math.max(0, Math.min(100, volume)));
        return true;
    }

    public boolean updateDeviceLatency(String roomId, String deviceId, int latency) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        Device device = room.getDevice(deviceId);
        if (device == null) {
            return false;
        }

        device.updateLatency(latency);
        return true;
    }

    public boolean updateDeviceHeartbeat(String roomId, String deviceId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return false;
        }

        Device device = room.getDevice(deviceId);
        if (device == null) {
            return false;
        }

        device.updateHeartbeat();
        return true;
    }

    public List<Device> getActiveDevices(String roomId) {
        Room room = rooms.get(roomId);
        if (room == null) {
            return List.of();
        }

        return room.getDevices().stream()
                .filter(Device::isActive)
                .collect(Collectors.toList());
    }

    public void cleanupInactiveDevices() {
        rooms.values().forEach(room -> {
            room.getDevices().stream()
                    .filter(device -> !device.isActive())
                    .forEach(device -> {
                        device.setConnectionQuality(ConnectionQuality.DISCONNECTED);
                    });
        });
    }

    public void removeRoom(String roomId) {
        Room room = rooms.remove(roomId);
        if (room != null) {
            roomCodeToId.remove(room.getCode());
        }
    }
}
