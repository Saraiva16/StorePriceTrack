package com.storepricetrack.store_price_track.modules.trips.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TripShoppingItemDTO(
        Long id,
        Long tripId,
        String name,
        BigDecimal quantity,
        BigDecimal unitPrice,
        String category,
        Boolean isCustomPrice,
        Boolean checked,
        Long addedByUserId,
        String addedByName,
        LocalDateTime createdAt
) {}
