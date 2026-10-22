package com.storepricetrack.store_price_track.modules.trips.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TripExpenseRequestDTO(
        @NotBlank(message = "A descrição do que foi gasto é obrigatória")
        String description,

        @NotNull(message = "O valor total é obrigatório")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
        BigDecimal amount,

        @NotNull(message = "A data do gasto é obrigatória")
        @JsonFormat(pattern = "yyyy-MM-dd")
        @JsonAlias({"expenseDate", "expense_date"})
        LocalDate expenseDate,

        @NotEmpty(message = "Selecione pelo menos uma pessoa para arcar com o rateio")
        @JsonAlias({"participantUserIds", "participant_user_ids"})
        List<Long> participantUserIds
) {}
