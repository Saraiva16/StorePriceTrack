package com.storepricetrack.store_price_track.modules.receipts.controller;

import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.service.IReceiptsService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Map;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
@Validated
public class ReceiptsController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptsController.class);

    private final IReceiptsService receiptsService;

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptResponseDTO> getById(@PathVariable Long id) {
        log.info("GET /api/receipts/{}", id);
        return ResponseEntity.ok(receiptsService.getById(id));
    }

    @GetMapping("/market/{marketId}")
    public ResponseEntity<PagedModel<ReceiptResponseDTO>> getByMarket(
            @PathVariable Long marketId, @PageableDefault(size = 20) Pageable pageable) {
        log.info("GET /api/receipts/market/{} - {}", marketId, pageable);
        return ResponseEntity.ok(new PagedModel<>(receiptsService.findByMarket(marketId, pageable)));
    }

    @GetMapping("/period")
    public ResponseEntity<PagedModel<ReceiptResponseDTO>> getByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("GET /api/receipts/period - start: {}, end: {}, {}", start, end, pageable);
        Page<ReceiptResponseDTO> page =
                receiptsService.findByPeriod(start.atStartOfDay(), end.atTime(LocalTime.MAX), pageable);
        return ResponseEntity.ok(new PagedModel<>(page));
    }

    @GetMapping("/recent")
    public ResponseEntity<PagedModel<ReceiptResponseDTO>> getRecent(
            @RequestParam(defaultValue = "3") @Min(value = 1, message = "deve ser no mínimo 1") int months,
            @PageableDefault(size = 20) Pageable pageable) {
        log.info("GET /api/receipts/recent - months: {}, {}", months, pageable);
        return ResponseEntity.ok(new PagedModel<>(receiptsService.getRecent(months, pageable)));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        log.warn("Receipt not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
