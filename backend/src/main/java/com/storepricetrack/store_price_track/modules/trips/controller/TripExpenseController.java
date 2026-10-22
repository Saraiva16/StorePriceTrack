package com.storepricetrack.store_price_track.modules.trips.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.trips.dto.TripExpenseRequestDTO;
import com.storepricetrack.store_price_track.modules.trips.dto.TripExpenseResponseDTO;
import com.storepricetrack.store_price_track.modules.trips.dto.UserDebtSummaryDTO;
import com.storepricetrack.store_price_track.modules.trips.service.TripExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips/{tripId}/expenses")
@RequiredArgsConstructor
public class TripExpenseController {

    private final TripExpenseService expenseService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<TripExpenseResponseDTO>> getExpenses(
            @PathVariable Long tripId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(expenseService.getTripExpenses(tripId, currentUser));
    }

    @PostMapping
    public ResponseEntity<TripExpenseResponseDTO> createExpense(
            @PathVariable Long tripId,
            @Valid @RequestBody TripExpenseRequestDTO request,
            @AuthenticationPrincipal User currentUser) {
        TripExpenseResponseDTO created = expenseService.createExpense(tripId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/debts")
    public ResponseEntity<List<UserDebtSummaryDTO>> getDebts(
            @PathVariable Long tripId,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(expenseService.getUserDebts(tripId, currentUser));
    }

    @DeleteMapping("/{expenseId}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long tripId,
            @PathVariable Long expenseId,
            @AuthenticationPrincipal User currentUser) {
        expenseService.deleteExpense(tripId, expenseId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/pix")
    public ResponseEntity<Map<String, String>> updatePixKey(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal User currentUser) {
        String pixKey = payload.get("pixKey");
        currentUser.setPixKey(pixKey != null ? pixKey.trim() : null);
        userRepository.save(currentUser);
        return ResponseEntity.ok(Map.of("message", "Chave Pix atualizada com sucesso", "pixKey", currentUser.getPixKey() != null ? currentUser.getPixKey() : ""));
    }
}
