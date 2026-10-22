package com.storepricetrack.store_price_track.modules.trips.dto;

import java.math.BigDecimal;
import java.util.List;

public record UserDebtSummaryDTO(
        Long creditorUserId,
        String creditorUsername,
        String creditorPixKey,
        BigDecimal totalOwed,
        List<DebtDetailItemDTO> details
) {}
