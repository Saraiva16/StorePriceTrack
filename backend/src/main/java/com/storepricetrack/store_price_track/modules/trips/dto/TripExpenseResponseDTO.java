package com.storepricetrack.store_price_track.modules.trips.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record TripExpenseResponseDTO(
        Long id,
        Long tripId,
        Long paidByUserId,
        String paidByUsername,
        String paidByPixKey,
        String description,
        BigDecimal amount,
        LocalDate expenseDate,
        List<TripExpenseSplitDTO> splits,
        LocalDateTime createdAt
) {}
