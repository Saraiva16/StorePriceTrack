package com.storepricetrack.store_price_track.modules.receipts.dto;

import java.math.BigDecimal;
import java.util.List;

public record SubmitCurationRequestDTO(
        String sourceUrl,
        String accessKey,
        String marketName,
        String marketCnpj,
        String purchaseDate,
        BigDecimal totalAmount,
        List<CurationItemDTO> items
) {}
