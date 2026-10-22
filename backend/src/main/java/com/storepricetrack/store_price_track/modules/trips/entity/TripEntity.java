package com.storepricetrack.store_price_track.modules.trips.entity;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "trips")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String destination;

    @Column(name = "address", nullable = false, columnDefinition = "VARCHAR(255) DEFAULT ''")
    private String address;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(name = "people_count", nullable = false)
    private Integer peopleCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdBy;

    @Builder.Default
    @OneToMany(mappedBy = "trip", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TripParticipantEntity> participants = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public TripStatus getCalculatedStatus() {
        if (startDate == null || endDate == null) {
            return TripStatus.SCHEDULED;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime start = LocalDateTime.of(startDate, startTime != null ? startTime : LocalTime.MIN);
        LocalDateTime end = LocalDateTime.of(endDate, endTime != null ? endTime : LocalTime.MAX);

        if (now.isBefore(start)) {
            return TripStatus.SCHEDULED;
        } else if (!now.isAfter(end)) {
            return TripStatus.ACTIVE;
        } else {
            return TripStatus.COMPLETED;
        }
    }
}
