package com.storepricetrack.store_price_track.modules.finance.dto;

import com.storepricetrack.store_price_track.modules.finance.entity.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryRequestDto {

    @NotBlank(message = "O nome da categoria é obrigatório")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    private String name;

    @NotNull(message = "O tipo da categoria é obrigatório")
    private TransactionType type;

    private String icon;
    private String color;
}

