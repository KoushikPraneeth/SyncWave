package com.audiosync.backend.config;

import com.audiosync.backend.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
public class SchedulerConfig {

    private final RoomService roomService;

    @Autowired
    public SchedulerConfig(RoomService roomService) {
        this.roomService = roomService;
    }

    /**
     * Scheduled task to clean up inactive devices and empty rooms
     * Runs every 30 seconds
     */
    @Scheduled(fixedRate = 30000)
    public void cleanupInactiveDevices() {
        roomService.cleanupInactiveDevices();
    }

    /**
     * Scheduled task to remove empty rooms
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000)
    public void cleanupEmptyRooms() {
        roomService.cleanupEmptyRooms();
    }
}
