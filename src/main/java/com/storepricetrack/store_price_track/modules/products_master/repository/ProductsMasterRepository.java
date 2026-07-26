package com.storepricetrack.store_price_track.modules.products_master.repository;

import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductsMasterRepository extends JpaRepository<ProductsMasterEntity, Long> {

    List<ProductsMasterEntity> findByNormalizedNameContainingIgnoreCase(String normalizedName);

    List<ProductsMasterEntity> findByCategoryId(Long categoryId);
}
