package com.storepricetrack.store_price_track.modules.finance.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardResponseDto {
    private Long id;
    private String name;
    private String bank;
    private BigDecimal creditLimit;
    private BigDecimal usedLimit;
    private BigDecimal availableLimit;
    private Integer closingDay;
    private Integer dueDay;
    private String color;
    private LocalDateTime createdAt;
}

