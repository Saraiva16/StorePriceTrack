package com.storepricetrack.store_price_track.modules.notifications.dto;

import java.time.LocalDateTime;

public record NotificationResponseDTO(
        Long id,
        String title,
        String message,
        String type,
        Long referenceId,
        boolean read,
        LocalDateTime createdAt
) {
}
