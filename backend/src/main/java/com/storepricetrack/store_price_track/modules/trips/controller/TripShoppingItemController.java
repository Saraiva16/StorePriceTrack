package com.storepricetrack.store_price_track.modules.trips.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.trips.dto.TripShoppingItemDTO;
import com.storepricetrack.store_price_track.modules.trips.dto.TripShoppingItemRequestDTO;
import com.storepricetrack.store_price_track.modules.trips.service.TripShoppingItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trips/{tripId}/items")
@RequiredArgsConstructor
public class TripShoppingItemController {

    private final TripShoppingItemService shoppingItemService;

    @GetMapping
    public ResponseEntity<List<TripShoppingItemDTO>> getItems(
            @PathVariable Long tripId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(shoppingItemService.getTripItems(tripId, user));
    }

    @PostMapping
    public ResponseEntity<TripShoppingItemDTO> addItem(
            @PathVariable Long tripId,
            @Valid @RequestBody TripShoppingItemRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(shoppingItemService.addItem(tripId, request, user));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<TripShoppingItemDTO> updateItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @RequestBody TripShoppingItemRequestDTO request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(shoppingItemService.updateItem(tripId, itemId, request, user));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable Long tripId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal User user) {
        shoppingItemService.deleteItem(tripId, itemId, user);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearItems(
            @PathVariable Long tripId,
            @AuthenticationPrincipal User user) {
        shoppingItemService.clearTripItems(tripId, user);
        return ResponseEntity.noContent().build();
    }
}
