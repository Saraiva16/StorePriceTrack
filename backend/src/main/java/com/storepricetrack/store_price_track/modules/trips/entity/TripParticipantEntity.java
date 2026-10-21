package com.storepricetrack.store_price_track.modules.trips.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "trip_participants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripParticipantEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trip_id", nullable = false)
    private TripEntity trip;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripParticipantRole role;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TripParticipantStatus status;

    @Builder.Default
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;
}
