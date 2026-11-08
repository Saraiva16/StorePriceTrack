package com.storepricetrack.store_price_track.modules.receipts.dto;

import java.math.BigDecimal;
import java.util.List;

public record NfcePreviewResponseDTO(
        String marketName,
        String cnpj,
        String purchaseDate,
        BigDecimal totalAmount,
        String accessKey,
        String sourceUrl,
        List<CurationItemDTO> items
) {}
