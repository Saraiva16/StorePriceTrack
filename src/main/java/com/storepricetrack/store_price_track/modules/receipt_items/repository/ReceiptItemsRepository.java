package com.storepricetrack.store_price_track.modules.receipt_items.repository;

import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReceiptItemsRepository extends JpaRepository<ReceiptItemsEntity, Long> {

    List<ReceiptItemsEntity> findByReceiptId(Long receiptId);

    List<ReceiptItemsEntity> findByProductId(Long productId);
}