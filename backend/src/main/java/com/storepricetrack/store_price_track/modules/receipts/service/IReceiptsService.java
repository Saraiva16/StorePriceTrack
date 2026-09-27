package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;

public interface IReceiptsService {

    Page<ReceiptResponseDTO> findByMarket(Long marketId, Pageable pageable);

    Page<ReceiptResponseDTO> findByPeriod(LocalDateTime start, LocalDateTime end, Pageable pageable);

    ReceiptResponseDTO getById(Long id);

    Page<ReceiptResponseDTO> getRecent(int months, Pageable pageable);
}
