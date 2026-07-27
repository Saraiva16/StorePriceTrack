package com.storepricetrack.store_price_track.modules.reports.controller;

import com.storepricetrack.store_price_track.modules.reports.dto.BestDayDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.MarketPriceComparisonDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PriceTrendPointDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.ProductPriceDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PurchasePatternDTO;
import com.storepricetrack.store_price_track.modules.reports.service.IBestDayAnalysisService;
import com.storepricetrack.store_price_track.modules.reports.service.IPriceAnalysisService;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Validated
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    private final IPriceAnalysisService priceAnalysisService;
    private final IBestDayAnalysisService bestDayAnalysisService;

    @GetMapping("/price-trends")
    public ResponseEntity<List<PriceTrendPointDTO>> getPriceTrend(@RequestParam Long productId) {
        log.info("GET /api/reports/price-trends - productId: {}", productId);
        return ResponseEntity.ok(priceAnalysisService.getPriceTrend(productId));
    }

    @GetMapping("/market-comparison")
    public ResponseEntity<List<MarketPriceComparisonDTO>> getMarketComparison(@RequestParam Long productId) {
        log.info("GET /api/reports/market-comparison - productId: {}", productId);
        return ResponseEntity.ok(priceAnalysisService.compareMarkets(productId));
    }

    @GetMapping("/products/cheapest")
    public ResponseEntity<List<ProductPriceDTO>> getCheapestProducts(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "deve ser no mínimo 1") int limit) {
        log.info("GET /api/reports/products/cheapest - limit: {}", limit);
        return ResponseEntity.ok(priceAnalysisService.getCheapestProducts(limit));
    }

    @GetMapping("/products/most-expensive")
    public ResponseEntity<List<ProductPriceDTO>> getMostExpensiveProducts(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "deve ser no mínimo 1") int limit) {
        log.info("GET /api/reports/products/most-expensive - limit: {}", limit);
        return ResponseEntity.ok(priceAnalysisService.getMostExpensiveProducts(limit));
    }

    @GetMapping("/best-shopping-days")
    public ResponseEntity<List<BestDayDTO>> getBestShoppingDays() {
        log.info("GET /api/reports/best-shopping-days");
        return ResponseEntity.ok(bestDayAnalysisService.getBestDaysToBuy());
    }

    @GetMapping("/purchase-pattern")
    public ResponseEntity<List<PurchasePatternDTO>> getPurchasePattern() {
        log.info("GET /api/reports/purchase-pattern");
        return ResponseEntity.ok(bestDayAnalysisService.getPurchasePattern());
    }
}
