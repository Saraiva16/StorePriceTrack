package com.storepricetrack.store_price_track.modules.trips.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record DebtDetailItemDTO(
        Long expenseId,
        String description,
        LocalDate expenseDate,
        BigDecimal totalExpenseAmount,
        BigDecimal yourShareAmount
) {}
