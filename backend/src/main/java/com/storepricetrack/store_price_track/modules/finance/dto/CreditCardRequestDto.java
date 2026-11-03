package com.storepricetrack.store_price_track.modules.finance.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreditCardRequestDto {

    @NotBlank(message = "O nome do cartão é obrigatório")
    @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres")
    private String name;

    @NotBlank(message = "O banco emissor é obrigatório")
    @Size(max = 100, message = "O banco deve ter no máximo 100 caracteres")
    private String bank;

    @NotNull(message = "O limite de crédito é obrigatório")
    @DecimalMin(value = "0.01", message = "O limite deve ser maior que zero")
    private BigDecimal creditLimit;

    @NotNull(message = "O dia de fechamento é obrigatório")
    @Min(value = 1, message = "O dia de fechamento deve ser entre 1 e 31")
    @Max(value = 31, message = "O dia de fechamento deve ser entre 1 e 31")
    private Integer closingDay;

    @NotNull(message = "O dia de vencimento é obrigatório")
    @Min(value = 1, message = "O dia de vencimento deve ser entre 1 e 31")
    @Max(value = 31, message = "O dia de vencimento deve ser entre 1 e 31")
    private Integer dueDay;

    private String color;
}

