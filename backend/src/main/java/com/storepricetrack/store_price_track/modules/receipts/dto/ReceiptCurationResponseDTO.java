package com.storepricetrack.store_price_track.modules.receipts.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ReceiptCurationResponseDTO(
        Long id,
        String sourceUrl,
        String accessKey,
        String marketName,
        String marketCnpj,
        LocalDateTime purchaseDate,
        BigDecimal totalAmount,
        String status,
        List<CurationItemDTO> items,
        LocalDateTime createdAt
) {}
