package com.storepricetrack.store_price_track.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategorySummaryDto {
    private Long categoryId;
    private String categoryName;
    private String color;
    private String icon;
    private BigDecimal totalAmount;
    private Double percentage;
}

