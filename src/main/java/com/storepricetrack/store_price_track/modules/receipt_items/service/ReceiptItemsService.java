package com.storepricetrack.store_price_track.modules.receipt_items.service;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.PriceStatsDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReceiptItemsService implements IReceiptItemsService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptItemsService.class);

    private final ReceiptItemsRepository receiptItemsRepository;

    @Override
    public List<ReceiptItemDTO> findByProduct(Long productId) {
        log.debug("Fetching receipt items for product {}", productId);
        return receiptItemsRepository.findByProductId(productId).stream()
                .map(i -> new ReceiptItemDTO(i.getOriginalNameOnReceipt(), i.getQuantity(), i.getUnitPrice(), i.getTotalPrice(), productId))
                .toList();
    }

    @Override
    public PriceStatsDTO getPriceStats(Long productId) {
        log.debug("Calculating price stats for product {}", productId);
        BigDecimal min = receiptItemsRepository.findMinUnitPriceByProductId(productId).orElse(null);
        BigDecimal max = receiptItemsRepository.findMaxUnitPriceByProductId(productId).orElse(null);
        BigDecimal avg = receiptItemsRepository.findAverageUnitPriceByProductId(productId)
                .map(a -> BigDecimal.valueOf(a).setScale(2, RoundingMode.HALF_UP))
                .orElse(null);
        return new PriceStatsDTO(productId, min, avg, max);
    }

    @Override
    public List<TopProductDTO> getTopProducts(int limit) {
        log.debug("Fetching top {} products", limit);
        return receiptItemsRepository.findTopProducts(PageRequest.of(0, limit));
    }
}
