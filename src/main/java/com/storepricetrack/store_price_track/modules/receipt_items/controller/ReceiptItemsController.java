package com.storepricetrack.store_price_track.modules.receipt_items.controller;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.PriceStatsDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.service.IReceiptItemsService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/receipt-items")
@RequiredArgsConstructor
public class ReceiptItemsController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptItemsController.class);

    private final IReceiptItemsService receiptItemsService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<ReceiptItemDTO>> getByProduct(@PathVariable Long productId) {
        log.info("GET /api/receipt-items/product/{}", productId);
        return ResponseEntity.ok(receiptItemsService.findByProduct(productId));
    }

    @GetMapping("/product/{productId}/price-stats")
    public ResponseEntity<PriceStatsDTO> getPriceStats(@PathVariable Long productId) {
        log.info("GET /api/receipt-items/product/{}/price-stats", productId);
        return ResponseEntity.ok(receiptItemsService.getPriceStats(productId));
    }

    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductDTO>> getTopProducts(@RequestParam(defaultValue = "10") int limit) {
        log.info("GET /api/receipt-items/top-products - limit: {}", limit);
        return ResponseEntity.ok(receiptItemsService.getTopProducts(limit));
    }
}
