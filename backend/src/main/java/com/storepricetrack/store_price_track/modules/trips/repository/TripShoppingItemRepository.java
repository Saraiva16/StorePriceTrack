package com.storepricetrack.store_price_track.modules.trips.repository;

import com.storepricetrack.store_price_track.modules.trips.entity.TripShoppingItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripShoppingItemRepository extends JpaRepository<TripShoppingItemEntity, Long> {
    List<TripShoppingItemEntity> findByTripIdOrderByIdAsc(Long tripId);
    void deleteByTripId(Long tripId);
}
