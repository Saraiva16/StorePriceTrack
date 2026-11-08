package com.storepricetrack.store_price_track.modules.receipts.repository;

import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptCurationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptCurationRepository extends JpaRepository<ReceiptCurationEntity, Long> {

    Page<ReceiptCurationEntity> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<ReceiptCurationEntity> findByStatus(String status);

    Optional<ReceiptCurationEntity> findFirstByAccessKey(String accessKey);
}
