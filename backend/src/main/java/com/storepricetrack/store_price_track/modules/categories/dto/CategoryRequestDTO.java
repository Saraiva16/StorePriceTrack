package com.storepricetrack.store_price_track.modules.categories.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryRequestDTO(
        @NotBlank(message = "não pode estar em branco")
        @Size(max = 100, message = "deve ter no máximo 100 caracteres")
        String name
) {
}
