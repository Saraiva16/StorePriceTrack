package com.storepricetrack.store_price_track.modules.finance.dto;

import com.storepricetrack.store_price_track.modules.finance.entity.PaymentMethod;
import com.storepricetrack.store_price_track.modules.finance.entity.TransactionType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransactionRequestDto {

    @NotBlank(message = "A descrição é obrigatória")
    @Size(max = 255, message = "A descrição deve ter no máximo 255 caracteres")
    private String description;

    @NotNull(message = "O valor é obrigatório")
    @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
    private BigDecimal amount;

    @NotNull(message = "O tipo (receita ou despesa) é obrigatório")
    private TransactionType type;

    @NotNull(message = "A data da transação é obrigatória")
    private LocalDate transactionDate;

    @NotNull(message = "A forma de pagamento é obrigatória")
    private PaymentMethod paymentMethod;

    private Long creditCardId;

    private Long categoryId;

    @Min(value = 1, message = "O número de parcelas deve ser no mínimo 1")
    @Max(value = 72, message = "O número de parcelas deve ser no máximo 72")
    private Integer totalInstallments;

    private String observation;
}

