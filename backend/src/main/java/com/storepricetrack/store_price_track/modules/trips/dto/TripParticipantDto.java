package com.storepricetrack.store_price_track.modules.trips.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripParticipantDto {
    private Long id;
    private Long userId;
    private String name;
    private String role;
    private String status;
    private BigDecimal balance;
    private LocalDateTime joinedAt;
}
