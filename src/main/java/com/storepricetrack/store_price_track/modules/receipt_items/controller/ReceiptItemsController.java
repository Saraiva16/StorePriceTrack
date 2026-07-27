package com.storepricetrack.store_price_track.modules.receipt_items.controller;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.PriceStatsDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.service.IReceiptItemsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/receipt-items")
@RequiredArgsConstructor
@Validated
@Tag(name = "Receipt Items", description = "Itens de recibo por produto, estatísticas de preço e ranking de mais comprados")
public class ReceiptItemsController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptItemsController.class);

    private final IReceiptItemsService receiptItemsService;

    @GetMapping("/product/{productId}")
    public ResponseEntity<PagedModel<ReceiptItemDTO>> getByProduct(
            @PathVariable Long productId, @PageableDefault(size = 20) Pageable pageable) {
        log.info("GET /api/receipt-items/product/{} - {}", productId, pageable);
        return ResponseEntity.ok(new PagedModel<>(receiptItemsService.findByProduct(productId, pageable)));
    }

    @Operation(summary = "Estatísticas de preço de um produto",
            description = "Retorna preço mínimo, médio e máximo já pago pelo produto, com base em todos os "
                    + "receipt_items vinculados a ele. Campos vêm nulos se o produto ainda não tem histórico.")
    @GetMapping("/product/{productId}/price-stats")
    public ResponseEntity<PriceStatsDTO> getPriceStats(@PathVariable Long productId) {
        log.info("GET /api/receipt-items/product/{}/price-stats", productId);
        return ResponseEntity.ok(receiptItemsService.getPriceStats(productId));
    }

    @Operation(summary = "Top N produtos mais comprados",
            description = "Ranking por quantidade total comprada (SUM de quantity), não por valor gasto.")
    @GetMapping("/top-products")
    public ResponseEntity<List<TopProductDTO>> getTopProducts(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "deve ser no mínimo 1") int limit) {
        log.info("GET /api/receipt-items/top-products - limit: {}", limit);
        return ResponseEntity.ok(receiptItemsService.getTopProducts(limit));
    }
}
