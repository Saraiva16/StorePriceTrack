package com.storepricetrack.store_price_track.modules.finance.dto;

import com.storepricetrack.store_price_track.modules.finance.entity.TransactionType;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryDto {
    private Long id;
    private String name;
    private TransactionType type;
    private String icon;
    private String color;
    private boolean custom;
}

