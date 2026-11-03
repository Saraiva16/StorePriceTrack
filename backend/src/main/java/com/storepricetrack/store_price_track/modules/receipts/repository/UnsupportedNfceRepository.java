package com.storepricetrack.store_price_track.modules.receipts.repository;

import com.storepricetrack.store_price_track.modules.receipts.entity.UnsupportedNfceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UnsupportedNfceRepository extends JpaRepository<UnsupportedNfceEntity, Long> {

    Optional<UnsupportedNfceEntity> findByUrl(String url);
}

