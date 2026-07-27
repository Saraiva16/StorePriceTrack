package com.storepricetrack.store_price_track.modules.receipts.repository;

import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptsRepository  extends JpaRepository<ReceiptsEntity, Long> {

    Optional<ReceiptsEntity> findByAccessKey(String accessKey);

    List<ReceiptsEntity> findByMarketId(Long marketId);

    List<ReceiptsEntity> findByMarketIdAndPurchaseDateBetween(Long marketId, LocalDateTime start, LocalDateTime end);

    List<ReceiptsEntity> findByPurchaseDateBetween(LocalDateTime start, LocalDateTime end);
}
