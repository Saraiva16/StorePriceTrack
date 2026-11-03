package com.storepricetrack.store_price_track.modules.finance.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.finance.dto.CreditCardRequestDto;
import com.storepricetrack.store_price_track.modules.finance.dto.CreditCardResponseDto;
import com.storepricetrack.store_price_track.modules.finance.entity.CreditCard;
import com.storepricetrack.store_price_track.modules.finance.repository.CreditCardRepository;
import com.storepricetrack.store_price_track.modules.finance.repository.FinancialTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreditCardService {

    private final CreditCardRepository creditCardRepository;
    private final FinancialTransactionRepository transactionRepository;

    @Transactional(readOnly = true)
    public List<CreditCardResponseDto> getCardsByUser(User user) {
        return creditCardRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(card -> toResponseDto(card, user.getId()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CreditCardResponseDto getCardById(Long id, User user) {
        CreditCard card = findCardEntityOrThrow(id, user.getId());
        return toResponseDto(card, user.getId());
    }

    @Transactional
    public CreditCardResponseDto createCard(CreditCardRequestDto dto, User user) {
        CreditCard card = CreditCard.builder()
                .user(user)
                .name(dto.getName().trim())
                .bank(dto.getBank().trim())
                .creditLimit(dto.getCreditLimit())
                .closingDay(dto.getClosingDay())
                .dueDay(dto.getDueDay())
                .color(dto.getColor() != null && !dto.getColor().isBlank() ? dto.getColor() : "#89b4b1")
                .build();

        CreditCard saved = creditCardRepository.save(card);
        return toResponseDto(saved, user.getId());
    }

    @Transactional
    public CreditCardResponseDto updateCard(Long id, CreditCardRequestDto dto, User user) {
        CreditCard card = findCardEntityOrThrow(id, user.getId());
        card.setName(dto.getName().trim());
        card.setBank(dto.getBank().trim());
        card.setCreditLimit(dto.getCreditLimit());
        card.setClosingDay(dto.getClosingDay());
        card.setDueDay(dto.getDueDay());
        if (dto.getColor() != null && !dto.getColor().isBlank()) {
            card.setColor(dto.getColor());
        }

        CreditCard updated = creditCardRepository.save(card);
        return toResponseDto(updated, user.getId());
    }

    @Transactional
    public void deleteCard(Long id, User user) {
        CreditCard card = findCardEntityOrThrow(id, user.getId());
        creditCardRepository.delete(card);
    }

    @Transactional(readOnly = true)
    public CreditCard findCardEntityOrThrow(Long id, Long userId) {
        return creditCardRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cartão de crédito não encontrado"));
    }

    private CreditCardResponseDto toResponseDto(CreditCard card, Long userId) {
        BigDecimal usedLimit = transactionRepository.sumAmountByCreditCardIdAndUserId(card.getId(), userId);
        if (usedLimit == null) usedLimit = BigDecimal.ZERO;
        
        BigDecimal availableLimit = card.getCreditLimit().subtract(usedLimit);
        if (availableLimit.compareTo(BigDecimal.ZERO) < 0) {
            availableLimit = BigDecimal.ZERO;
        }

        return CreditCardResponseDto.builder()
                .id(card.getId())
                .name(card.getName())
                .bank(card.getBank())
                .creditLimit(card.getCreditLimit())
                .usedLimit(usedLimit)
                .availableLimit(availableLimit)
                .closingDay(card.getClosingDay())
                .dueDay(card.getDueDay())
                .color(card.getColor())
                .createdAt(card.getCreatedAt())
                .build();
    }
}

