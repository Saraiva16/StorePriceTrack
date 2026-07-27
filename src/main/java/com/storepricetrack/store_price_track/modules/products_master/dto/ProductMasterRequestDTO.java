package com.storepricetrack.store_price_track.modules.products_master.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductMasterRequestDTO(
        @NotBlank(message = "não pode estar em branco")
        @Size(max = 255, message = "deve ter no máximo 255 caracteres")
        String normalizedName,

        @Size(max = 100, message = "deve ter no máximo 100 caracteres")
        String brand,

        @Size(max = 10, message = "deve ter no máximo 10 caracteres")
        String unitMeasure,

        Long categoryId
) {
}
