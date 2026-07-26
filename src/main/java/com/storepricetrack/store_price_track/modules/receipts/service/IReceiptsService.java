package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;

import java.time.LocalDateTime;
import java.util.List;

public interface IReceiptsService {

    List<ReceiptResponseDTO> findByMarket(Long marketId);

    List<ReceiptResponseDTO> findByPeriod(LocalDateTime start, LocalDateTime end);

    ReceiptResponseDTO getById(Long id);

    List<ReceiptResponseDTO> getRecent(int months);
}
