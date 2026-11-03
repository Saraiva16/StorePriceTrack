package com.storepricetrack.store_price_track.modules.finance.dto;

import com.storepricetrack.store_price_track.modules.finance.entity.PaymentMethod;
import com.storepricetrack.store_price_track.modules.finance.entity.TransactionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransactionResponseDto {
    private Long id;
    private String description;
    private BigDecimal amount;
    private TransactionType type;
    private LocalDate transactionDate;
    private LocalDate invoiceDate;
    private PaymentMethod paymentMethod;
    private Long creditCardId;
    private String creditCardName;
    private String creditCardBank;
    private String creditCardColor;
    private Long categoryId;
    private String categoryName;
    private String categoryColor;
    private String categoryIcon;
    private String installmentGroupId;
    private Integer installmentNumber;
    private Integer totalInstallments;
    private String observation;
    private LocalDateTime createdAt;
}

