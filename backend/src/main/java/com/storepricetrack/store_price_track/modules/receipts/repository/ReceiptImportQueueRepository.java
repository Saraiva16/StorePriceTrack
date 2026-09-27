package com.storepricetrack.store_price_track.modules.receipts.repository;

import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptImportQueueEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceiptImportQueueRepository extends JpaRepository<ReceiptImportQueueEntity, Long> {
    List<ReceiptImportQueueEntity> findByStatusOrderByCreatedAtAsc(String status);
}
