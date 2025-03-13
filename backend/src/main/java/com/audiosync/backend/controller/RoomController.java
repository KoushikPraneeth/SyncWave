package com.audiosync.backend.controller;

import com.audiosync.backend.model.Device;
import com.audiosync.backend.model.Room;
import com.audiosync.backend.model.RoomDTO;
import com.audiosync.backend.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {

    private final RoomService roomService;

    @Autowired
    public RoomController(RoomService roomService) {
        this.roomService = roomService;
    }

    @PostMapping
    public ResponseEntity<RoomDTO> createRoom(@RequestParam String hostId) {
        Room room = roomService.createRoom(hostId);
        return ResponseEntity.ok(RoomDTO.fromRoom(room));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<RoomDTO> getRoomById(@PathVariable String roomId) {
        return roomService.getRoomById(roomId)
                .map(room -> ResponseEntity.ok(RoomDTO.fromRoom(room)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<RoomDTO> getRoomByCode(@PathVariable String code) {
        return roomService.getRoomByCode(code)
                .map(room -> ResponseEntity.ok(RoomDTO.fromRoom(room)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{roomId}/devices")
    public ResponseEntity<List<Device>> getRoomDevices(@PathVariable String roomId) {
        return roomService.getRoomById(roomId)
                .map(room -> ResponseEntity.ok(room.getDevices()))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{roomId}/active-devices")
    public ResponseEntity<List<Device>> getActiveDevices(@PathVariable String roomId) {
        List<Device> activeDevices = roomService.getActiveDevices(roomId);
        return ResponseEntity.ok(activeDevices);
    }

    @DeleteMapping("/{roomId}")
    public ResponseEntity<Void> deleteRoom(@PathVariable String roomId) {
        roomService.removeRoom(roomId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/host/{hostId}")
    public ResponseEntity<List<RoomDTO>> getRoomsByHost(@PathVariable String hostId) {
        List<RoomDTO> rooms = roomService.getRoomsByHost(hostId).stream()
                .map(RoomDTO::fromRoom)
                .collect(Collectors.toList());
        return ResponseEntity.ok(rooms);
    }
}
