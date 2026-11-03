package com.storepricetrack.store_price_track.modules.finance.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.finance.dto.FinancialSummaryDto;
import com.storepricetrack.store_price_track.modules.finance.dto.FinancialTransactionRequestDto;
import com.storepricetrack.store_price_track.modules.finance.dto.FinancialTransactionResponseDto;
import com.storepricetrack.store_price_track.modules.finance.service.FinancialTransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/finance/transactions")
@RequiredArgsConstructor
public class FinancialTransactionController {

    private final FinancialTransactionService transactionService;

    @GetMapping
    public ResponseEntity<List<FinancialTransactionResponseDto>> getMonthlyTransactions(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthenticationPrincipal User user
    ) {
        LocalDate now = LocalDate.now();
        int targetYear = (year != null) ? year : now.getYear();
        int targetMonth = (month != null) ? month : now.getMonthValue();

        return ResponseEntity.ok(transactionService.getMonthlyTransactions(targetYear, targetMonth, user));
    }

    @GetMapping("/summary")
    public ResponseEntity<FinancialSummaryDto> getMonthlySummary(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @AuthenticationPrincipal User user
    ) {
        LocalDate now = LocalDate.now();
        int targetYear = (year != null) ? year : now.getYear();
        int targetMonth = (month != null) ? month : now.getMonthValue();

        return ResponseEntity.ok(transactionService.getMonthlySummary(targetYear, targetMonth, user));
    }

    @PostMapping
    public ResponseEntity<FinancialTransactionResponseDto> createTransaction(
            @Valid @RequestBody FinancialTransactionRequestDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(transactionService.createTransaction(dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean deleteAllInstallments,
            @AuthenticationPrincipal User user
    ) {
        transactionService.deleteTransaction(id, deleteAllInstallments, user);
        return ResponseEntity.noContent().build();
    }
}

