package com.storepricetrack.store_price_track.modules.finance.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.finance.dto.CreditCardRequestDto;
import com.storepricetrack.store_price_track.modules.finance.dto.CreditCardResponseDto;
import com.storepricetrack.store_price_track.modules.finance.service.CreditCardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/finance/cards")
@RequiredArgsConstructor
public class CreditCardController {

    private final CreditCardService creditCardService;

    @GetMapping
    public ResponseEntity<List<CreditCardResponseDto>> getCards(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(creditCardService.getCardsByUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CreditCardResponseDto> getCardById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(creditCardService.getCardById(id, user));
    }

    @PostMapping
    public ResponseEntity<CreditCardResponseDto> createCard(
            @Valid @RequestBody CreditCardRequestDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(creditCardService.createCard(dto, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CreditCardResponseDto> updateCard(
            @PathVariable Long id,
            @Valid @RequestBody CreditCardRequestDto dto,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(creditCardService.updateCard(id, dto, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCard(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        creditCardService.deleteCard(id, user);
        return ResponseEntity.noContent().build();
    }
}

