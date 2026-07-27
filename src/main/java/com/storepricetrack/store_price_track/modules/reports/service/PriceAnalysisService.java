package com.storepricetrack.store_price_track.modules.reports.service;

import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.reports.dto.MarketPriceComparisonDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PriceTrendPointDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.ProductPriceDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class PriceAnalysisService implements IPriceAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(PriceAnalysisService.class);

    private final ReceiptItemsRepository receiptItemsRepository;

    @Override
    @Cacheable(value = "priceTrend", key = "#productId")
    public List<PriceTrendPointDTO> getPriceTrend(Long productId) {
        log.debug("Calculating price trend for product {}", productId);
        Map<YearMonth, List<BigDecimal>> byMonth = receiptItemsRepository.findByProductId(productId).stream()
                .collect(Collectors.groupingBy(
                        i -> YearMonth.from(i.getReceipt().getPurchaseDate()),
                        TreeMap::new,
                        Collectors.mapping(ReceiptItemsEntity::getUnitPrice, Collectors.toList())));
        return byMonth.entrySet().stream()
                .map(e -> new PriceTrendPointDTO(e.getKey(), average(e.getValue())))
                .toList();
    }

    @Override
    @Cacheable(value = "marketComparison", key = "#productId")
    public List<MarketPriceComparisonDTO> compareMarkets(Long productId) {
        log.debug("Comparing markets for product {}", productId);
        Map<Long, List<ReceiptItemsEntity>> byMarket = receiptItemsRepository.findByProductId(productId).stream()
                .collect(Collectors.groupingBy(i -> i.getReceipt().getMarket().getId()));
        return byMarket.values().stream()
                .map(group -> {
                    MarketsEntity market = group.get(0).getReceipt().getMarket();
                    List<BigDecimal> prices = group.stream().map(ReceiptItemsEntity::getUnitPrice).toList();
                    return new MarketPriceComparisonDTO(
                            market.getId(), market.getName(),
                            min(prices), average(prices), max(prices), prices.size());
                })
                .sorted(Comparator.comparing(MarketPriceComparisonDTO::avgPrice))
                .toList();
    }

    @Override
    @Cacheable(value = "cheapestProducts", key = "#limit")
    public List<ProductPriceDTO> getCheapestProducts(int limit) {
        log.debug("Fetching {} cheapest products", limit);
        return aggregateByProduct().stream()
                .sorted(Comparator.comparing(ProductPriceDTO::avgPrice))
                .limit(limit)
                .toList();
    }

    @Override
    @Cacheable(value = "mostExpensiveProducts", key = "#limit")
    public List<ProductPriceDTO> getMostExpensiveProducts(int limit) {
        log.debug("Fetching {} most expensive products", limit);
        return aggregateByProduct().stream()
                .sorted(Comparator.comparing(ProductPriceDTO::avgPrice).reversed())
                .limit(limit)
                .toList();
    }

    private List<ProductPriceDTO> aggregateByProduct() {
        Map<Long, List<ReceiptItemsEntity>> byProduct = receiptItemsRepository.findByProductIsNotNull().stream()
                .collect(Collectors.groupingBy(i -> i.getProduct().getId()));
        return byProduct.values().stream()
                .map(group -> {
                    ProductsMasterEntity product = group.get(0).getProduct();
                    List<BigDecimal> prices = group.stream().map(ReceiptItemsEntity::getUnitPrice).toList();
                    return new ProductPriceDTO(product.getId(), product.getNormalizedName(), average(prices));
                })
                .toList();
    }

    private BigDecimal average(List<BigDecimal> values) {
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal min(List<BigDecimal> values) {
        return values.stream().min(Comparator.naturalOrder()).orElse(null);
    }

    private BigDecimal max(List<BigDecimal> values) {
        return values.stream().max(Comparator.naturalOrder()).orElse(null);
    }
}
