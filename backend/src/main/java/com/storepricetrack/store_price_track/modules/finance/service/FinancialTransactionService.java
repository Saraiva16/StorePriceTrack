package com.storepricetrack.store_price_track.modules.finance.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.finance.dto.*;
import com.storepricetrack.store_price_track.modules.finance.entity.*;
import com.storepricetrack.store_price_track.modules.finance.repository.FinancialTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FinancialTransactionService {

    private final FinancialTransactionRepository transactionRepository;
    private final CreditCardService creditCardService;
    private final FinancialCategoryService categoryService;

    @Transactional(readOnly = true)
    public List<FinancialTransactionResponseDto> getMonthlyTransactions(int year, int month, User user) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        return transactionRepository.findByUserIdAndInvoiceDateBetweenOrderByTransactionDateDesc(
                        user.getId(), startDate, endDate
                ).stream()
                .map(this::toResponseDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FinancialSummaryDto getMonthlySummary(int year, int month, User user) {
        LocalDate startDate = LocalDate.of(year, month, 1);
        LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());

        List<FinancialTransaction> transactions = transactionRepository
                .findByUserIdAndInvoiceDateBetweenOrderByTransactionDateDesc(user.getId(), startDate, endDate);

        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpense = BigDecimal.ZERO;
        Map<Long, CategorySummaryAccumulator> categoryMap = new LinkedHashMap<>();

        for (FinancialTransaction tx : transactions) {
            if (tx.getType() == TransactionType.INCOME) {
                totalIncome = totalIncome.add(tx.getAmount());
            } else if (tx.getType() == TransactionType.EXPENSE) {
                totalExpense = totalExpense.add(tx.getAmount());

                Long catId = (tx.getCategory() != null) ? tx.getCategory().getId() : 0L;
                String catName = (tx.getCategory() != null) ? tx.getCategory().getName() : "Sem categoria";
                String catColor = (tx.getCategory() != null && tx.getCategory().getColor() != null) ? tx.getCategory().getColor() : "#95a5a6";
                String catIcon = (tx.getCategory() != null && tx.getCategory().getIcon() != null) ? tx.getCategory().getIcon() : "Tag";

                categoryMap.computeIfAbsent(catId, k -> new CategorySummaryAccumulator(catId, catName, catColor, catIcon))
                        .addAmount(tx.getAmount());
            }
        }

        BigDecimal balance = totalIncome.subtract(totalExpense);

        List<CategorySummaryDto> categorySummaries = new ArrayList<>();
        for (CategorySummaryAccumulator acc : categoryMap.values()) {
            Double percentage = 0.0;
            if (totalExpense.compareTo(BigDecimal.ZERO) > 0) {
                percentage = acc.totalAmount
                        .multiply(BigDecimal.valueOf(100))
                        .divide(totalExpense, 1, RoundingMode.HALF_UP)
                        .doubleValue();
            }
            categorySummaries.add(CategorySummaryDto.builder()
                    .categoryId(acc.categoryId)
                    .categoryName(acc.categoryName)
                    .color(acc.color)
                    .icon(acc.icon)
                    .totalAmount(acc.totalAmount)
                    .percentage(percentage)
                    .build());
        }

        // Ordenar categorias pelo maior valor de despesa
        categorySummaries.sort((a, b) -> b.getTotalAmount().compareTo(a.getTotalAmount()));

        return FinancialSummaryDto.builder()
                .year(year)
                .month(month)
                .totalIncome(totalIncome)
                .totalExpense(totalExpense)
                .balance(balance)
                .expenseByCategory(categorySummaries)
                .build();
    }

    @Transactional
    public FinancialTransactionResponseDto createTransaction(FinancialTransactionRequestDto dto, User user) {
        CreditCard card = null;
        if (dto.getPaymentMethod() == PaymentMethod.CREDIT_CARD) {
            if (dto.getCreditCardId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Para compras no cartão, selecione um cartão cadastrado");
            }
            card = creditCardService.findCardEntityOrThrow(dto.getCreditCardId(), user.getId());
        }

        FinancialCategory category = null;
        if (dto.getCategoryId() != null) {
            category = categoryService.findCategoryEntityOrThrow(dto.getCategoryId(), user.getId());
        }

        int totalInstallments = (dto.getTotalInstallments() != null && dto.getTotalInstallments() > 1) 
                ? dto.getTotalInstallments() 
                : 1;

        if (totalInstallments == 1) {
            LocalDate invoiceDate = calculateInvoiceDate(dto.getTransactionDate(), card);
            FinancialTransaction tx = FinancialTransaction.builder()
                    .user(user)
                    .description(dto.getDescription().trim())
                    .amount(dto.getAmount())
                    .type(dto.getType())
                    .transactionDate(dto.getTransactionDate())
                    .invoiceDate(invoiceDate)
                    .paymentMethod(dto.getPaymentMethod())
                    .creditCard(card)
                    .category(category)
                    .installmentNumber(1)
                    .totalInstallments(1)
                    .observation(dto.getObservation())
                    .build();

            FinancialTransaction saved = transactionRepository.save(tx);
            return toResponseDto(saved);
        }

        // Criação de N parcelas
        String groupId = UUID.randomUUID().toString();
        BigDecimal totalAmount = dto.getAmount();
        BigDecimal baseInstallment = totalAmount.divide(BigDecimal.valueOf(totalInstallments), 2, RoundingMode.HALF_UP);
        BigDecimal remainder = totalAmount.subtract(baseInstallment.multiply(BigDecimal.valueOf(totalInstallments)));

        LocalDate firstInvoiceDate = calculateInvoiceDate(dto.getTransactionDate(), card);
        YearMonth baseInvoiceMonth = YearMonth.from(firstInvoiceDate);
        YearMonth baseTxMonth = YearMonth.from(dto.getTransactionDate());
        int originalDay = dto.getTransactionDate().getDayOfMonth();

        FinancialTransaction firstTx = null;

        for (int k = 1; k <= totalInstallments; k++) {
            BigDecimal installmentAmount = (k == 1) ? baseInstallment.add(remainder) : baseInstallment;

            YearMonth pInvoiceMonth = baseInvoiceMonth.plusMonths(k - 1);
            LocalDate pInvoiceDate = pInvoiceMonth.atDay(Math.min(originalDay, pInvoiceMonth.lengthOfMonth()));

            YearMonth pTxMonth = baseTxMonth.plusMonths(k - 1);
            LocalDate pTxDate = pTxMonth.atDay(Math.min(originalDay, pTxMonth.lengthOfMonth()));

            FinancialTransaction tx = FinancialTransaction.builder()
                    .user(user)
                    .description(dto.getDescription().trim())
                    .amount(installmentAmount)
                    .type(dto.getType())
                    .transactionDate(pTxDate)
                    .invoiceDate(pInvoiceDate)
                    .paymentMethod(dto.getPaymentMethod())
                    .creditCard(card)
                    .category(category)
                    .installmentGroupId(groupId)
                    .installmentNumber(k)
                    .totalInstallments(totalInstallments)
                    .observation(dto.getObservation())
                    .build();

            FinancialTransaction saved = transactionRepository.save(tx);
            if (k == 1) {
                firstTx = saved;
            }
        }

        return toResponseDto(firstTx);
    }

    @Transactional
    public FinancialTransactionResponseDto updateTransaction(Long id, FinancialTransactionRequestDto dto, User user) {
        FinancialTransaction tx = transactionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transação não encontrada"));

        CreditCard card = null;
        if (dto.getPaymentMethod() == PaymentMethod.CREDIT_CARD) {
            if (dto.getCreditCardId() == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Para compras no cartão, selecione um cartão cadastrado");
            }
            card = creditCardService.findCardEntityOrThrow(dto.getCreditCardId(), user.getId());
        }

        FinancialCategory category = null;
        if (dto.getCategoryId() != null) {
            category = categoryService.findCategoryEntityOrThrow(dto.getCategoryId(), user.getId());
        }

        LocalDate invoiceDate = calculateInvoiceDate(dto.getTransactionDate(), card);

        tx.setDescription(dto.getDescription().trim());
        tx.setAmount(dto.getAmount());
        tx.setType(dto.getType());
        tx.setTransactionDate(dto.getTransactionDate());
        tx.setInvoiceDate(invoiceDate);
        tx.setPaymentMethod(dto.getPaymentMethod());
        tx.setCreditCard(card);
        tx.setCategory(category);
        tx.setObservation(dto.getObservation());

        FinancialTransaction saved = transactionRepository.save(tx);
        return toResponseDto(saved);
    }

    @Transactional
    public void deleteTransaction(Long id, boolean deleteAllInstallments, User user) {
        FinancialTransaction tx = transactionRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Transação não encontrada"));

        if (deleteAllInstallments && tx.getInstallmentGroupId() != null) {
            transactionRepository.deleteByInstallmentGroupIdAndUserId(tx.getInstallmentGroupId(), user.getId());
        } else {
            transactionRepository.delete(tx);
        }
    }

    public LocalDate calculateInvoiceDate(LocalDate txDate, CreditCard card) {
        if (card == null) {
            return txDate;
        }

        int maxDayOfMonth = YearMonth.from(txDate).lengthOfMonth();
        int closingDay = Math.min(card.getClosingDay(), maxDayOfMonth);

        if (txDate.getDayOfMonth() <= closingDay) {
            // Entra na fatura do próprio mês
            YearMonth ym = YearMonth.from(txDate);
            return ym.atDay(Math.min(txDate.getDayOfMonth(), ym.lengthOfMonth()));
        } else {
            // Virada de fatura: entra na fatura do mês seguinte
            YearMonth nextYm = YearMonth.from(txDate).plusMonths(1);
            return nextYm.atDay(Math.min(txDate.getDayOfMonth(), nextYm.lengthOfMonth()));
        }
    }

    private FinancialTransactionResponseDto toResponseDto(FinancialTransaction tx) {
        return FinancialTransactionResponseDto.builder()
                .id(tx.getId())
                .description(tx.getDescription())
                .amount(tx.getAmount())
                .type(tx.getType())
                .transactionDate(tx.getTransactionDate())
                .invoiceDate(tx.getInvoiceDate())
                .paymentMethod(tx.getPaymentMethod())
                .creditCardId(tx.getCreditCard() != null ? tx.getCreditCard().getId() : null)
                .creditCardName(tx.getCreditCard() != null ? tx.getCreditCard().getName() : null)
                .creditCardBank(tx.getCreditCard() != null ? tx.getCreditCard().getBank() : null)
                .creditCardColor(tx.getCreditCard() != null ? tx.getCreditCard().getColor() : null)
                .categoryId(tx.getCategory() != null ? tx.getCategory().getId() : null)
                .categoryName(tx.getCategory() != null ? tx.getCategory().getName() : "Sem categoria")
                .categoryColor(tx.getCategory() != null ? tx.getCategory().getColor() : "#95a5a6")
                .categoryIcon(tx.getCategory() != null ? tx.getCategory().getIcon() : "Tag")
                .installmentGroupId(tx.getInstallmentGroupId())
                .installmentNumber(tx.getInstallmentNumber())
                .totalInstallments(tx.getTotalInstallments())
                .observation(tx.getObservation())
                .createdAt(tx.getCreatedAt())
                .build();
    }

    private static class CategorySummaryAccumulator {
        final Long categoryId;
        final String categoryName;
        final String color;
        final String icon;
        BigDecimal totalAmount = BigDecimal.ZERO;

        CategorySummaryAccumulator(Long categoryId, String categoryName, String color, String icon) {
            this.categoryId = categoryId;
            this.categoryName = categoryName;
            this.color = color;
            this.icon = icon;
        }

        void addAmount(BigDecimal amount) {
            this.totalAmount = this.totalAmount.add(amount);
        }
    }
}

