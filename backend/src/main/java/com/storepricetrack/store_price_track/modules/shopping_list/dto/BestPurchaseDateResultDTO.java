package com.storepricetrack.store_price_track.modules.shopping_list.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BestPurchaseDateResultDTO {
    private LocalDateTime bestDate;
    private BigDecimal savingsPercentage;
}
