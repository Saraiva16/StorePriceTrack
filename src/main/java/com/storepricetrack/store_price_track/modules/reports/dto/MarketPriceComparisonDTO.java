package com.storepricetrack.store_price_track.modules.reports.dto;

import java.math.BigDecimal;

public record MarketPriceComparisonDTO(
        Long marketId,
        String marketName,
        BigDecimal minPrice,
        BigDecimal avgPrice,
        BigDecimal maxPrice,
        long purchaseCount
) {
}
