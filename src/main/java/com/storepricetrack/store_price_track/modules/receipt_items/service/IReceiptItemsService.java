package com.storepricetrack.store_price_track.modules.receipt_items.service;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.PriceStatsDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO;

import java.util.List;

public interface IReceiptItemsService {

    List<ReceiptItemDTO> findByProduct(Long productId);

    PriceStatsDTO getPriceStats(Long productId);

    List<TopProductDTO> getTopProducts(int limit);
}
