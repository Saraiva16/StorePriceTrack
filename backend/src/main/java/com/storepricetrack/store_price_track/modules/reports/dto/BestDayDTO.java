package com.storepricetrack.store_price_track.modules.reports.dto;

import java.math.BigDecimal;
import java.time.DayOfWeek;

public record BestDayDTO(
        DayOfWeek dayOfWeek,
        BigDecimal avgDeviationPercent,
        long sampleSize
) {
}
