package com.storepricetrack.store_price_track.modules.markets.repository;

import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketsRepository extends JpaRepository<MarketsEntity, Long> {

    Optional<MarketsEntity> findByCnpj(String cnpj);

    List<MarketsEntity> findByNameContainingIgnoreCase(String name);
}
