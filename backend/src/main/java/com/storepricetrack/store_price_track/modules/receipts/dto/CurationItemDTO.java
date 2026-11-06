package com.storepricetrack.store_price_track.modules.receipts.dto;

import java.math.BigDecimal;
import java.util.List;

public record CurationItemDTO(
        String originalName,
        String normalizedName,
        String brand,
        String unitMeasure,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        String category
) {}
