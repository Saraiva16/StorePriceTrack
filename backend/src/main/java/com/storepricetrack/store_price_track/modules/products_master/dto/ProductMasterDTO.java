package com.storepricetrack.store_price_track.modules.products_master.dto;

public record ProductMasterDTO(
        Long id,
        String normalizedName,
        String brand,
        String unitMeasure,
        Long categoryId,
        String categoryName
) {
}