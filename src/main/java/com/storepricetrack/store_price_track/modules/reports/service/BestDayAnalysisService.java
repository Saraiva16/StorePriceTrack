package com.storepricetrack.store_price_track.modules.reports.service;

import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import com.storepricetrack.store_price_track.modules.reports.dto.BestDayDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PurchasePatternDTO;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class BestDayAnalysisService implements IBestDayAnalysisService {

    private static final Logger log = LoggerFactory.getLogger(BestDayAnalysisService.class);

    private final ReceiptItemsRepository receiptItemsRepository;
    private final ReceiptsRepository receiptsRepository;

    @Override
    public List<BestDayDTO> getBestDaysToBuy() {
        log.debug("Calculating best days to buy based on price deviation from each product's average");
        List<ReceiptItemsEntity> items = receiptItemsRepository.findByProductIsNotNull();

        Map<Long, BigDecimal> avgPriceByProduct = items.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getProduct().getId(),
                        Collectors.collectingAndThen(
                                Collectors.mapping(ReceiptItemsEntity::getUnitPrice, Collectors.toList()),
                                this::average)));

        Map<DayOfWeek, List<BigDecimal>> deviationsByDay = items.stream()
                .collect(Collectors.groupingBy(
                        i -> i.getReceipt().getPurchaseDate().getDayOfWeek(),
                        Collectors.mapping(
                                i -> deviationPercent(i.getUnitPrice(), avgPriceByProduct.get(i.getProduct().getId())),
                                Collectors.toList())));

        return deviationsByDay.entrySet().stream()
                .map(e -> new BestDayDTO(e.getKey(), average(e.getValue()), e.getValue().size()))
                .sorted(Comparator.comparing(BestDayDTO::avgDeviationPercent))
                .toList();
    }

    @Override
    public List<PurchasePatternDTO> getPurchasePattern() {
        log.debug("Calculating purchase pattern by day of week");
        Map<DayOfWeek, Long> countByDay = receiptsRepository.findAll().stream()
                .collect(Collectors.groupingBy(r -> r.getPurchaseDate().getDayOfWeek(), Collectors.counting()));
        return Arrays.stream(DayOfWeek.values())
                .map(day -> new PurchasePatternDTO(day, countByDay.getOrDefault(day, 0L)))
                .toList();
    }

    private BigDecimal deviationPercent(BigDecimal price, BigDecimal avgPrice) {
        if (avgPrice == null || avgPrice.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return price.subtract(avgPrice)
                .divide(avgPrice, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal average(List<BigDecimal> values) {
        BigDecimal sum = values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        return sum.divide(BigDecimal.valueOf(values.size()), 2, RoundingMode.HALF_UP);
    }
}
