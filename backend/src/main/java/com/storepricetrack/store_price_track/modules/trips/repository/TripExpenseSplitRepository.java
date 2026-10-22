package com.storepricetrack.store_price_track.modules.trips.repository;

import com.storepricetrack.store_price_track.modules.trips.entity.TripExpenseSplitEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripExpenseSplitRepository extends JpaRepository<TripExpenseSplitEntity, Long> {
    List<TripExpenseSplitEntity> findByExpenseTripId(Long tripId);
    List<TripExpenseSplitEntity> findByUserId(Long userId);
}
