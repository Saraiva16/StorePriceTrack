package com.storepricetrack.store_price_track.modules.receipts.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.util.List;

public record ApproveCurationRequestDTO(
        @JsonAlias({"market_name", "marketName"}) String marketName,
        @JsonAlias({"total_amount", "totalAmount"}) BigDecimal totalAmount,
        @JsonAlias("items") List<CurationItemDTO> items
) {}
