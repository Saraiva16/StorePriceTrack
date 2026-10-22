package com.storepricetrack.store_price_track.modules.trips.dto;

import java.math.BigDecimal;

public record TripExpenseSplitDTO(
        Long id,
        Long userId,
        String username,
        BigDecimal shareAmount
) {}
