package com.storepricetrack.store_price_track.modules.categories.repository;

import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoriesRepository extends JpaRepository<CategoriesEntity, Long> {

    Optional<CategoriesEntity> findByName(String name);
}
