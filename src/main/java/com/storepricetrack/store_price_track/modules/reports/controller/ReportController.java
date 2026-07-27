package com.storepricetrack.store_price_track.modules.reports.controller;

import com.storepricetrack.store_price_track.modules.reports.dto.BestDayDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.MarketPriceComparisonDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PriceTrendPointDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.ProductPriceDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PurchasePatternDTO;
import com.storepricetrack.store_price_track.modules.reports.service.IBestDayAnalysisService;
import com.storepricetrack.store_price_track.modules.reports.service.IPriceAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Reports", description = "Análise de preços e padrões de compra")
public class ReportController {

    private static final Logger log = LoggerFactory.getLogger(ReportController.class);

    private final IPriceAnalysisService priceAnalysisService;
    private final IBestDayAnalysisService bestDayAnalysisService;

    @Operation(summary = "Tendência de preço de um produto por mês",
            description = "Preço médio pago pelo produto, agrupado por mês de compra (YearMonth), em ordem cronológica.")
    @GetMapping("/price-trends")
    public ResponseEntity<List<PriceTrendPointDTO>> getPriceTrend(@RequestParam Long productId) {
        log.info("GET /api/reports/price-trends - productId: {}", productId);
        return ResponseEntity.ok(priceAnalysisService.getPriceTrend(productId));
    }

    @Operation(summary = "Compara o preço de um produto entre mercados",
            description = "Min/média/máx pago pelo produto em cada mercado onde já foi comprado, ordenado do mais barato pro mais caro.")
    @GetMapping("/market-comparison")
    public ResponseEntity<List<MarketPriceComparisonDTO>> getMarketComparison(@RequestParam Long productId) {
        log.info("GET /api/reports/market-comparison - productId: {}", productId);
        return ResponseEntity.ok(priceAnalysisService.compareMarkets(productId));
    }

    @Operation(summary = "Produtos mais baratos em média",
            description = "Ranking de produtos_master por preço médio pago, do mais barato pro mais caro.")
    @GetMapping("/products/cheapest")
    public ResponseEntity<List<ProductPriceDTO>> getCheapestProducts(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "deve ser no mínimo 1") int limit) {
        log.info("GET /api/reports/products/cheapest - limit: {}", limit);
        return ResponseEntity.ok(priceAnalysisService.getCheapestProducts(limit));
    }

    @Operation(summary = "Produtos mais caros em média",
            description = "Ranking de produtos_master por preço médio pago, do mais caro pro mais barato.")
    @GetMapping("/products/most-expensive")
    public ResponseEntity<List<ProductPriceDTO>> getMostExpensiveProducts(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "deve ser no mínimo 1") int limit) {
        log.info("GET /api/reports/products/most-expensive - limit: {}", limit);
        return ResponseEntity.ok(priceAnalysisService.getMostExpensiveProducts(limit));
    }

    @Operation(summary = "Melhor dia da semana para comprar",
            description = "Para cada dia da semana, calcula o desvio percentual médio do preço de cada item em "
                    + "relação à média histórica do próprio produto (não o preço absoluto, que misturaria produtos "
                    + "diferentes numa cesta variada). Ordenado do dia com maior desconto médio pro de maior sobrepreço.")
    @GetMapping("/best-shopping-days")
    public ResponseEntity<List<BestDayDTO>> getBestShoppingDays() {
        log.info("GET /api/reports/best-shopping-days");
        return ResponseEntity.ok(bestDayAnalysisService.getBestDaysToBuy());
    }

    @Operation(summary = "Padrão de compra por dia da semana",
            description = "Quantidade de recibos importados em cada um dos 7 dias da semana (hábito de compra, não preço).")
    @GetMapping("/purchase-pattern")
    public ResponseEntity<List<PurchasePatternDTO>> getPurchasePattern() {
        log.info("GET /api/reports/purchase-pattern");
        return ResponseEntity.ok(bestDayAnalysisService.getPurchasePattern());
    }
}
