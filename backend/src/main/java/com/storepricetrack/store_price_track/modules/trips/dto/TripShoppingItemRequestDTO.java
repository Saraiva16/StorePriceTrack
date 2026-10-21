package com.storepricetrack.store_price_track.modules.trips.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record TripShoppingItemRequestDTO(
        @NotBlank(message = "O nome do item não pode estar em branco")
        String name,

        @JsonAlias({"qty", "quantity"})
        BigDecimal quantity,

        @JsonAlias({"unit_price", "unitPrice", "price"})
        BigDecimal unitPrice,

        String category,

        @JsonAlias({"is_custom_price", "isCustomPrice"})
        Boolean isCustomPrice
) {}
