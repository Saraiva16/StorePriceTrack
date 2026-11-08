package com.storepricetrack.store_price_track.modules.receipts.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;

public record CurationItemDTO(
        @JsonAlias({"original_name", "originalName", "name"}) String originalName,
        @JsonAlias({"normalized_name", "normalizedName"}) String normalizedName,
        @JsonAlias("brand") String brand,
        @JsonAlias({"unit_measure", "unitMeasure"}) String unitMeasure,
        @JsonAlias("quantity") BigDecimal quantity,
        @JsonAlias({"unit_price", "unitPrice"}) BigDecimal unitPrice,
        @JsonAlias({"total_price", "totalPrice"}) BigDecimal totalPrice,
        @JsonAlias("category") String category
) {}
