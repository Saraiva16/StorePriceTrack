package com.storepricetrack.store_price_track.modules.reports.dto;

import java.math.BigDecimal;

public record ProductPriceDTO(
        Long productId,
        String productName,
        BigDecimal avgPrice
) {
}
