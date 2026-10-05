package com.storepricetrack.store_price_track.modules.shopping_list.service;

import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListEntity;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListItemEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import com.storepricetrack.store_price_track.modules.shopping_list.dto.BestPurchaseDateResultDTO;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BestPurchaseDateCalculator {

    private final ReceiptItemsRepository receiptItemsRepository;

    public BestPurchaseDateResultDTO calculateBestDate(ShoppingListEntity shoppingList) {
        if (shoppingList.getItems() == null || shoppingList.getItems().isEmpty()) {
            return new BestPurchaseDateResultDTO(LocalDateTime.now().plusDays(1), BigDecimal.ZERO); // default fallback
        }

        List<Long> productIds = shoppingList.getItems().stream()
                .map(item -> item.getProduct().getId())
                .collect(Collectors.toList());

        List<ReceiptItemsEntity> historicalItems = receiptItemsRepository.findByProductIdInWithReceipt(productIds);

        if (historicalItems.isEmpty()) {
            return new BestPurchaseDateResultDTO(LocalDateTime.now().plusDays(1), BigDecimal.ZERO); // no data
        }

        // Map product id -> list of prices per day of week
        Map<Long, Map<DayOfWeek, List<BigDecimal>>> priceHistoryByProductAndDay = new HashMap<>();

        for (ReceiptItemsEntity item : historicalItems) {
            Long pId = item.getProduct().getId();
            DayOfWeek day = item.getReceipt().getPurchaseDate().getDayOfWeek();
            BigDecimal price = item.getUnitPrice();

            priceHistoryByProductAndDay.computeIfAbsent(pId, k -> new EnumMap<>(DayOfWeek.class));
            priceHistoryByProductAndDay.get(pId).computeIfAbsent(day, k -> new ArrayList<>()).add(price);
        }

        // Calculate average price per product per day of week
        Map<DayOfWeek, BigDecimal> totalCartValuePerDay = new EnumMap<>(DayOfWeek.class);

        for (DayOfWeek day : DayOfWeek.values()) {
            BigDecimal cartValueForDay = BigDecimal.ZERO;
            for (ShoppingListItemEntity listItem : shoppingList.getItems()) {
                Long pId = listItem.getProduct().getId();
                BigDecimal qty = listItem.getQuantity();
                
                BigDecimal avgPrice = getAveragePriceForDay(priceHistoryByProductAndDay.get(pId), day);
                cartValueForDay = cartValueForDay.add(avgPrice.multiply(qty));
            }
            totalCartValuePerDay.put(day, cartValueForDay);
        }

        // Find the day with minimum cart value and maximum cart value
        DayOfWeek bestDay = null;
        BigDecimal minCartValue = BigDecimal.valueOf(Double.MAX_VALUE);
        BigDecimal maxCartValue = BigDecimal.ZERO;

        for (Map.Entry<DayOfWeek, BigDecimal> entry : totalCartValuePerDay.entrySet()) {
            if (entry.getValue().compareTo(minCartValue) < 0 && entry.getValue().compareTo(BigDecimal.ZERO) > 0) {
                minCartValue = entry.getValue();
                bestDay = entry.getKey();
            }
            if (entry.getValue().compareTo(maxCartValue) > 0) {
                maxCartValue = entry.getValue();
            }
        }

        if (bestDay == null) {
            bestDay = DayOfWeek.SATURDAY; // fallback
        }

        BigDecimal savingsPercentage = BigDecimal.ZERO;
        if (maxCartValue.compareTo(BigDecimal.ZERO) > 0 && minCartValue.compareTo(maxCartValue) < 0) {
            savingsPercentage = maxCartValue.subtract(minCartValue)
                    .divide(maxCartValue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }

        // Find the NEXT occurrence of this best day
        LocalDate nextBestDayDate = LocalDate.now().with(TemporalAdjusters.next(bestDay));
        return new BestPurchaseDateResultDTO(nextBestDayDate.atTime(10, 0), savingsPercentage);
    }

    private BigDecimal getAveragePriceForDay(Map<DayOfWeek, List<BigDecimal>> productPrices, DayOfWeek day) {
        if (productPrices == null || !productPrices.containsKey(day) || productPrices.get(day).isEmpty()) {
            // fallback: calculate overall average if no data for this specific day
            return getOverallAverage(productPrices);
        }

        List<BigDecimal> prices = productPrices.get(day);
        BigDecimal sum = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(prices.size()), 2, java.math.RoundingMode.HALF_UP);
    }

    private BigDecimal getOverallAverage(Map<DayOfWeek, List<BigDecimal>> productPrices) {
        if (productPrices == null || productPrices.isEmpty()) return BigDecimal.ZERO;
        List<BigDecimal> allPrices = productPrices.values().stream().flatMap(List::stream).collect(Collectors.toList());
        if (allPrices.isEmpty()) return BigDecimal.ZERO;

        BigDecimal sum = allPrices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(allPrices.size()), 2, java.math.RoundingMode.HALF_UP);
    }
}
