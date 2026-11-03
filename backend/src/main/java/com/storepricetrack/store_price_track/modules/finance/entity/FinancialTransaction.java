package com.storepricetrack.store_price_track.modules.finance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "financial_transactions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 30)
    private PaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    private CreditCard creditCard;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private FinancialCategory category;

    @Column(name = "installment_group_id", length = 50)
    private String installmentGroupId;

    @Builder.Default
    @Column(name = "installment_number", nullable = false)
    private Integer installmentNumber = 1;

    @Builder.Default
    @Column(name = "total_installments", nullable = false)
    private Integer totalInstallments = 1;

    @Column(columnDefinition = "TEXT")
    private String observation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

