package com.storepricetrack.store_price_track.modules.trips.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.trips.dto.TripShoppingItemDTO;
import com.storepricetrack.store_price_track.modules.trips.dto.TripShoppingItemRequestDTO;
import com.storepricetrack.store_price_track.modules.trips.entity.TripEntity;
import com.storepricetrack.store_price_track.modules.trips.entity.TripShoppingItemEntity;
import com.storepricetrack.store_price_track.modules.trips.repository.TripRepository;
import com.storepricetrack.store_price_track.modules.trips.repository.TripShoppingItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripShoppingItemService {

    private final TripRepository tripRepository;
    private final TripShoppingItemRepository shoppingItemRepository;

    @Transactional(readOnly = true)
    public List<TripShoppingItemDTO> getTripItems(Long tripId, User user) {
        verifyTripExists(tripId);
        return shoppingItemRepository.findByTripIdOrderByIdAsc(tripId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripShoppingItemDTO addItem(Long tripId, TripShoppingItemRequestDTO request, User user) {
        TripEntity trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada com id: " + tripId));

        String trimmedName = request.name().trim();
        List<TripShoppingItemEntity> existingItems = shoppingItemRepository.findByTripIdOrderByIdAsc(tripId);

        TripShoppingItemEntity item = existingItems.stream()
                .filter(i -> i.getName().equalsIgnoreCase(trimmedName))
                .findFirst()
                .orElse(null);

        BigDecimal addQty = request.quantity() != null && request.quantity().compareTo(BigDecimal.ZERO) > 0
                ? request.quantity()
                : BigDecimal.ONE;

        BigDecimal unitPrice = request.unitPrice() != null && request.unitPrice().compareTo(BigDecimal.ZERO) >= 0
                ? request.unitPrice()
                : BigDecimal.ZERO;

        if (item != null) {
            item.setQuantity(item.getQuantity().add(addQty));
            if (request.unitPrice() != null && request.unitPrice().compareTo(BigDecimal.ZERO) > 0) {
                item.setUnitPrice(request.unitPrice());
                item.setIsCustomPrice(true);
            }
            if (request.category() != null && !request.category().isBlank()) {
                item.setCategory(request.category());
            }
        } else {
            item = TripShoppingItemEntity.builder()
                    .trip(trip)
                    .name(trimmedName)
                    .quantity(addQty)
                    .unitPrice(unitPrice)
                    .category(request.category() != null && !request.category().isBlank() ? request.category() : "Outros")
                    .isCustomPrice(request.isCustomPrice() != null ? request.isCustomPrice() : unitPrice.compareTo(BigDecimal.ZERO) > 0)
                    .addedBy(user)
                    .build();
        }

        TripShoppingItemEntity saved = shoppingItemRepository.save(item);
        return toDTO(saved);
    }

    @Transactional
    public TripShoppingItemDTO updateItem(Long tripId, Long itemId, TripShoppingItemRequestDTO request, User user) {
        TripShoppingItemEntity item = shoppingItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item não encontrado com id: " + itemId));

        if (!item.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("O item informado não pertence à viagem informada.");
        }

        if (request.name() != null && !request.name().isBlank()) {
            item.setName(request.name().trim());
        }
        if (request.quantity() != null) {
            item.setQuantity(request.quantity().max(BigDecimal.ONE));
        }
        if (request.unitPrice() != null) {
            item.setUnitPrice(request.unitPrice().max(BigDecimal.ZERO));
            item.setIsCustomPrice(true);
        }
        if (request.category() != null && !request.category().isBlank()) {
            item.setCategory(request.category());
        }
        if (request.isCustomPrice() != null) {
            item.setIsCustomPrice(request.isCustomPrice());
        }

        TripShoppingItemEntity saved = shoppingItemRepository.save(item);
        return toDTO(saved);
    }

    @Transactional
    public void deleteItem(Long tripId, Long itemId, User user) {
        TripShoppingItemEntity item = shoppingItemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("Item não encontrado com id: " + itemId));

        if (!item.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("O item informado não pertence à viagem informada.");
        }

        shoppingItemRepository.delete(item);
    }

    @Transactional
    public void clearTripItems(Long tripId, User user) {
        verifyTripExists(tripId);
        shoppingItemRepository.deleteByTripId(tripId);
    }

    private void verifyTripExists(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new EntityNotFoundException("Viagem não encontrada com id: " + tripId);
        }
    }

    private TripShoppingItemDTO toDTO(TripShoppingItemEntity entity) {
        Long addedByUserId = entity.getAddedBy() != null ? entity.getAddedBy().getId() : null;
        String addedByName = entity.getAddedBy() != null ? entity.getAddedBy().getUsername() : null;

        return new TripShoppingItemDTO(
                entity.getId(),
                entity.getTrip().getId(),
                entity.getName(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getCategory(),
                entity.getIsCustomPrice(),
                addedByUserId,
                addedByName,
                entity.getCreatedAt()
        );
    }
}
