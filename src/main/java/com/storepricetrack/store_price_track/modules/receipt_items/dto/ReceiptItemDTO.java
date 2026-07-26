package com.storepricetrack.store_price_track.modules.receipt_items.dto;

import java.math.BigDecimal;

public record ReceiptItemDTO(
        String originalName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice) {
}
