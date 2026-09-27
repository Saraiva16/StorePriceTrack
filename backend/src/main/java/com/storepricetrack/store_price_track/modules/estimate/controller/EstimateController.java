package com.storepricetrack.store_price_track.modules.estimate.controller;

import com.storepricetrack.store_price_track.modules.estimate.dto.EstimateRequestDTO;
import com.storepricetrack.store_price_track.modules.estimate.service.EstimateService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/estimate")
@RequiredArgsConstructor
public class EstimateController {

    private final EstimateService estimateService;

    @PostMapping("/recalculate")
    public ResponseEntity<Map<String, BigDecimal>> recalculate(@RequestBody EstimateRequestDTO request) {
        return ResponseEntity.ok(estimateService.calculateEstimate(request));
    }
}
