package com.storepricetrack.store_price_track.modules.receipts.controller;

import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.service.IReceiptsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptsController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptsController.class);

    private final IReceiptsService receiptsService;

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptResponseDTO> getById(@PathVariable Long id) {
        log.info("GET /api/receipts/{}", id);
        return ResponseEntity.ok(receiptsService.getById(id));
    }

    @GetMapping("/market/{marketId}")
    public ResponseEntity<List<ReceiptResponseDTO>> getByMarket(@PathVariable Long marketId) {
        log.info("GET /api/receipts/market/{}", marketId);
        return ResponseEntity.ok(receiptsService.findByMarket(marketId));
    }

    @GetMapping("/period")
    public ResponseEntity<List<ReceiptResponseDTO>> getByPeriod(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end) {
        log.info("GET /api/receipts/period - start: {}, end: {}", start, end);
        return ResponseEntity.ok(receiptsService.findByPeriod(start.atStartOfDay(), end.atTime(LocalTime.MAX)));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<ReceiptResponseDTO>> getRecent(@RequestParam(defaultValue = "3") int months) {
        log.info("GET /api/receipts/recent - months: {}", months);
        return ResponseEntity.ok(receiptsService.getRecent(months));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        log.warn("Receipt not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
