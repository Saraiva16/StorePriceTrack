package com.storepricetrack.store_price_track.modules.trips.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.trips.dto.TripRequestDto;
import com.storepricetrack.store_price_track.modules.trips.dto.TripResponseDto;
import com.storepricetrack.store_price_track.modules.trips.service.TripService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trips")
@RequiredArgsConstructor
public class TripController {

    private final TripService tripService;

    @GetMapping
    public ResponseEntity<List<TripResponseDto>> getUserTrips(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.getUserTrips(user));
    }

    @PostMapping
    public ResponseEntity<TripResponseDto> createTrip(
            @Valid @RequestBody TripRequestDto request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tripService.createTrip(request, user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TripResponseDto> getTripById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.getTripById(id, user));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TripResponseDto> updateTrip(
            @PathVariable Long id,
            @Valid @RequestBody TripRequestDto request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.updateTrip(id, request, user));
    }

    @PostMapping("/{id}/increase-capacity")
    public ResponseEntity<TripResponseDto> increaseCapacity(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.increaseCapacity(id, user));
    }

    @PostMapping("/{id}/decrease-capacity")
    public ResponseEntity<TripResponseDto> decreaseCapacity(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.decreaseCapacity(id, user));
    }

    @DeleteMapping("/{id}/participants/{participantId}")
    public ResponseEntity<TripResponseDto> revokeParticipant(
            @PathVariable Long id,
            @PathVariable Long participantId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(tripService.revokeParticipant(id, participantId, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrip(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        tripService.deleteTrip(id, user);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }

    @ExceptionHandler(jakarta.persistence.EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFound(jakarta.persistence.EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", ex.getMessage()));
    }
}
