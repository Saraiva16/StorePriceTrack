package com.storepricetrack.store_price_track.modules.receipt_items.dto;

import java.math.BigDecimal;

public record PriceStatsDTO(
        Long productId,
        BigDecimal minPrice,
        BigDecimal avgPrice,
        BigDecimal maxPrice
) {
}
