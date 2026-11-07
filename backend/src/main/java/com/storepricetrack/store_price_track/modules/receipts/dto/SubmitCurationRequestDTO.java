package com.storepricetrack.store_price_track.modules.receipts.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.math.BigDecimal;
import java.util.List;

public record SubmitCurationRequestDTO(
        @JsonAlias({"source_url", "sourceUrl"}) String sourceUrl,
        @JsonAlias({"access_key", "accessKey"}) String accessKey,
        @JsonAlias({"market_name", "marketName"}) String marketName,
        @JsonAlias({"market_cnpj", "marketCnpj", "cnpj"}) String marketCnpj,
        @JsonAlias({"purchase_date", "purchaseDate"}) String purchaseDate,
        @JsonAlias({"total_amount", "totalAmount"}) BigDecimal totalAmount,
        @JsonAlias("items") List<CurationItemDTO> items
) {}
