package com.storepricetrack.store_price_track.modules.receipt_items.dto;

import java.math.BigDecimal;

public record TopProductDTO(
        Long productId,
        String productName,
        BigDecimal totalQuantity,
        long purchaseCount
) {
}
