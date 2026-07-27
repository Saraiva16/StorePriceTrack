package com.storepricetrack.store_price_track.modules.reports.dto;

import java.time.DayOfWeek;

public record PurchasePatternDTO(
        DayOfWeek dayOfWeek,
        long receiptCount
) {
}
