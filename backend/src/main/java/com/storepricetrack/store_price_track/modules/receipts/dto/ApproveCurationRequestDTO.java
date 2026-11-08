package com.storepricetrack.store_price_track.modules.receipts.dto;

import java.math.BigDecimal;
import java.util.List;

public record ApproveCurationRequestDTO(
        String marketName,
        BigDecimal totalAmount,
        List<CurationItemDTO> items
) {}
