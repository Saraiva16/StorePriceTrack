package com.storepricetrack.store_price_track.modules.receipt_items.dto;

import java.math.BigDecimal;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name = "receipt_items")
public record ReceiptItemDTO(
        String originalName,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice) {
}
