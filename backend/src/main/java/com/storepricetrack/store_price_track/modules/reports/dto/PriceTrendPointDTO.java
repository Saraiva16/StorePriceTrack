package com.storepricetrack.store_price_track.modules.reports.dto;

import java.math.BigDecimal;
import java.time.YearMonth;

public record PriceTrendPointDTO(
        YearMonth period,
        BigDecimal avgPrice
) {
}
