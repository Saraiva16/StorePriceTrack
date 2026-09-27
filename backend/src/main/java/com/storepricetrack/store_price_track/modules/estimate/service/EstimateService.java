package com.storepricetrack.store_price_track.modules.estimate.service;

import com.storepricetrack.store_price_track.modules.estimate.dto.EstimateRequestDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EstimateService {

    private final ReceiptItemsRepository itemsRepository;

    public Map<String, BigDecimal> calculateEstimate(EstimateRequestDTO request) {
        Map<String, BigDecimal> result = new HashMap<>();

        if (request.getProducts() == null || request.getMarketName() == null) {
            return result;
        }

        for (String product : request.getProducts()) {
            List<BigDecimal> prices = itemsRepository.findPricesByProductAndMarket(product, request.getMarketName());
            if (prices != null && !prices.isEmpty()) {
                BigDecimal avg = calculateAverageWithoutOutliers(prices);
                result.put(product, avg);
            }
        }

        return result;
    }

    private BigDecimal calculateAverageWithoutOutliers(List<BigDecimal> prices) {
        if (prices.size() <= 2) {
            return getAverage(prices);
        }

        List<Double> doublePrices = prices.stream()
                .map(BigDecimal::doubleValue)
                .sorted()
                .collect(Collectors.toList());

        int q1Index = doublePrices.size() / 4;
        int q3Index = doublePrices.size() * 3 / 4;

        double q1 = doublePrices.get(q1Index);
        double q3 = doublePrices.get(q3Index);
        double iqr = q3 - q1;

        double lowerBound = q1 - 1.5 * iqr;
        double upperBound = q3 + 1.5 * iqr;

        List<BigDecimal> filtered = prices.stream()
                .filter(p -> p.doubleValue() >= lowerBound && p.doubleValue() <= upperBound)
                .collect(Collectors.toList());

        if (filtered.isEmpty()) {
            return getAverage(prices);
        }

        return getAverage(filtered);
    }

    private BigDecimal getAverage(List<BigDecimal> prices) {
        BigDecimal sum = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(new BigDecimal(prices.size()), 2, RoundingMode.HALF_UP);
    }
}
