package com.storepricetrack.store_price_track.modules.trips.repository;

import com.storepricetrack.store_price_track.modules.trips.entity.TripExpenseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripExpenseRepository extends JpaRepository<TripExpenseEntity, Long> {
    List<TripExpenseEntity> findByTripIdOrderByExpenseDateDescIdDesc(Long tripId);
}
