package com.storepricetrack.store_price_track.modules.markets.dto;

public record MarketDTO(
        Long id,
        String name,
        String cnpj,
        String address,
        String cityUf
) {
}