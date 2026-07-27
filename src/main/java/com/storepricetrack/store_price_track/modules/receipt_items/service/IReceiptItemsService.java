package com.storepricetrack.store_price_track.modules.receipt_items.service;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.PriceStatsDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IReceiptItemsService {

    Page<ReceiptItemDTO> findByProduct(Long productId, Pageable pageable);

    PriceStatsDTO getPriceStats(Long productId);

    List<TopProductDTO> getTopProducts(int limit);
}
