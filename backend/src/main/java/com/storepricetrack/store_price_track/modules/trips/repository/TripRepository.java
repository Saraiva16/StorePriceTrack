package com.storepricetrack.store_price_track.modules.trips.repository;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.trips.entity.TripEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TripRepository extends JpaRepository<TripEntity, Long> {

    @Query("SELECT DISTINCT t FROM TripEntity t LEFT JOIN t.participants p WHERE t.createdBy = :user OR p.user = :user ORDER BY t.createdAt DESC")
    List<TripEntity> findAllTripsForUser(@Param("user") User user);
}
