package com.storepricetrack.store_price_track.modules.receipts.controller;

import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionException;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.exception.DuplicateReceiptException;
import com.storepricetrack.store_price_track.modules.receipts.service.IReceiptImportService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/receipts")
@RequiredArgsConstructor
public class ReceiptImportController {

    private static final Logger log = LoggerFactory.getLogger(ReceiptImportController.class);

    private final IReceiptImportService receiptImportService;

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ReceiptResponseDTO> importReceipt(@RequestParam("file") MultipartFile file) {
        log.info("POST /api/receipts/import - file: {}", file.getOriginalFilename());
        ReceiptResponseDTO response = receiptImportService.importReceipt(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @ExceptionHandler(DuplicateReceiptException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateReceiptException ex) {
        log.warn("Duplicate receipt: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(ReceiptExtractionException.class)
    public ResponseEntity<Map<String, String>> handleExtractionError(ReceiptExtractionException ex) {
        log.error("Receipt extraction failed: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", ex.getMessage()));
    }
}
