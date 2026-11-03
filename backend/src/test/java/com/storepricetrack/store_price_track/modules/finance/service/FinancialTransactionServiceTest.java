package com.storepricetrack.store_price_track.modules.finance.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.finance.dto.FinancialSummaryDto;
import com.storepricetrack.store_price_track.modules.finance.dto.FinancialTransactionRequestDto;
import com.storepricetrack.store_price_track.modules.finance.dto.FinancialTransactionResponseDto;
import com.storepricetrack.store_price_track.modules.finance.entity.*;
import com.storepricetrack.store_price_track.modules.finance.repository.FinancialTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FinancialTransactionServiceTest {

    private FinancialTransactionRepository transactionRepository;
    private CreditCardService creditCardService;
    private FinancialCategoryService categoryService;
    private FinancialTransactionService transactionService;

    private User testUser;
    private CreditCard testCard;
    private FinancialCategory testCategory;

    @BeforeEach
    void setUp() {
        transactionRepository = mock(FinancialTransactionRepository.class);
        creditCardService = mock(CreditCardService.class);
        categoryService = mock(FinancialCategoryService.class);

        transactionService = new FinancialTransactionService(
                transactionRepository,
                creditCardService,
                categoryService
        );

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .build();

        testCard = CreditCard.builder()
                .id(10L)
                .user(testUser)
                .name("Nubank")
                .bank("Nubank")
                .creditLimit(new BigDecimal("3000.00"))
                .closingDay(20)
                .dueDay(27)
                .build();

        testCategory = FinancialCategory.builder()
                .id(5L)
                .name("Alimentação")
                .type(TransactionType.EXPENSE)
                .color("#f59c8d")
                .icon("Utensils")
                .build();
    }

    @Test
    @DisplayName("Deve alocar compra no cartão na fatura do mês atual se for antes ou no dia do fechamento")
    void testCalculateInvoiceDate_BeforeClosingDay() {
        LocalDate purchaseDate = LocalDate.of(2026, 11, 15);
        LocalDate invoiceDate = transactionService.calculateInvoiceDate(purchaseDate, testCard);

        assertEquals(11, invoiceDate.getMonthValue());
        assertEquals(2026, invoiceDate.getYear());
    }

    @Test
    @DisplayName("Deve alocar compra no cartão na fatura do mês seguinte se for após o dia de fechamento")
    void testCalculateInvoiceDate_AfterClosingDay() {
        LocalDate purchaseDate = LocalDate.of(2026, 11, 25);
        LocalDate invoiceDate = transactionService.calculateInvoiceDate(purchaseDate, testCard);

        assertEquals(12, invoiceDate.getMonthValue());
        assertEquals(2026, invoiceDate.getYear());
    }

    @Test
    @DisplayName("Deve manter data original se a transação não for vinculada a cartão de crédito")
    void testCalculateInvoiceDate_WithoutCard() {
        LocalDate purchaseDate = LocalDate.of(2026, 11, 28);
        LocalDate invoiceDate = transactionService.calculateInvoiceDate(purchaseDate, null);

        assertEquals(purchaseDate, invoiceDate);
    }

    @Test
    @DisplayName("Deve gerar N parcelas individuais com mesmo groupId e meses subsequentes")
    void testCreateTransaction_Installments() {
        when(creditCardService.findCardEntityOrThrow(10L, 1L)).thenReturn(testCard);
        when(categoryService.findCategoryEntityOrThrow(5L, 1L)).thenReturn(testCategory);

        List<FinancialTransaction> savedTxs = new ArrayList<>();
        when(transactionRepository.save(any(FinancialTransaction.class))).thenAnswer(invocation -> {
            FinancialTransaction tx = invocation.getArgument(0);
            tx.setId((long) (savedTxs.size() + 1));
            savedTxs.add(tx);
            return tx;
        });

        FinancialTransactionRequestDto dto = FinancialTransactionRequestDto.builder()
                .description("Geladeira")
                .amount(new BigDecimal("300.00"))
                .type(TransactionType.EXPENSE)
                .transactionDate(LocalDate.of(2026, 11, 25)) // após fechamento dia 20 -> fatura 1 em Dezembro
                .paymentMethod(PaymentMethod.CREDIT_CARD)
                .creditCardId(10L)
                .categoryId(5L)
                .totalInstallments(3)
                .build();

        FinancialTransactionResponseDto response = transactionService.createTransaction(dto, testUser);

        assertNotNull(response);
        assertEquals(1, response.getInstallmentNumber());
        assertEquals(3, response.getTotalInstallments());
        assertEquals(new BigDecimal("100.00"), response.getAmount());

        assertEquals(3, savedTxs.size());

        // Todas devem compartilhar o mesmo groupId
        String groupId = savedTxs.get(0).getInstallmentGroupId();
        assertNotNull(groupId);
        assertEquals(groupId, savedTxs.get(1).getInstallmentGroupId());
        assertEquals(groupId, savedTxs.get(2).getInstallmentGroupId());

        // Faturas devem ser Dez/2026, Jan/2027, Fev/2027
        assertEquals(12, savedTxs.get(0).getInvoiceDate().getMonthValue());
        assertEquals(2026, savedTxs.get(0).getInvoiceDate().getYear());

        assertEquals(1, savedTxs.get(1).getInvoiceDate().getMonthValue());
        assertEquals(2027, savedTxs.get(1).getInvoiceDate().getYear());

        assertEquals(2, savedTxs.get(2).getInvoiceDate().getMonthValue());
        assertEquals(2027, savedTxs.get(2).getInvoiceDate().getYear());
    }

    @Test
    @DisplayName("Deve calcular resumo mensal com balanço e percentuais por categoria")
    void testGetMonthlySummary() {
        FinancialTransaction salary = FinancialTransaction.builder()
                .id(1L)
                .amount(new BigDecimal("5000.00"))
                .type(TransactionType.INCOME)
                .invoiceDate(LocalDate.of(2026, 11, 5))
                .build();

        FinancialTransaction marketExpense = FinancialTransaction.builder()
                .id(2L)
                .amount(new BigDecimal("1000.00"))
                .type(TransactionType.EXPENSE)
                .category(testCategory)
                .invoiceDate(LocalDate.of(2026, 11, 10))
                .build();

        when(transactionRepository.findByUserIdAndInvoiceDateBetweenOrderByTransactionDateDesc(
                eq(1L), any(LocalDate.class), any(LocalDate.class)
        )).thenReturn(List.of(salary, marketExpense));

        FinancialSummaryDto summary = transactionService.getMonthlySummary(2026, 11, testUser);

        assertNotNull(summary);
        assertEquals(new BigDecimal("5000.00"), summary.getTotalIncome());
        assertEquals(new BigDecimal("1000.00"), summary.getTotalExpense());
        assertEquals(new BigDecimal("4000.00"), summary.getBalance());
        assertEquals(1, summary.getExpenseByCategory().size());
        assertEquals(100.0, summary.getExpenseByCategory().get(0).getPercentage());
    }
}
