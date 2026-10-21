package com.storepricetrack.store_price_track.modules.trips.repository;

import com.storepricetrack.store_price_track.modules.trips.entity.TripParticipantEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripParticipantRepository extends JpaRepository<TripParticipantEntity, Long> {
    List<TripParticipantEntity> findByTripId(Long tripId);
}
