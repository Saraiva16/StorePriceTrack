package com.storepricetrack.store_price_track.modules.markets.controller;

import com.storepricetrack.store_price_track.modules.markets.service.IMarketsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/markets")
@RequiredArgsConstructor
public class MarketsController {

    private final IMarketsService service;

    @GetMapping("/networks")
    public ResponseEntity<List<String>> getMarketNetworks() {
        return ResponseEntity.ok(service.getDistinctMarketNetworks());
    }
}
