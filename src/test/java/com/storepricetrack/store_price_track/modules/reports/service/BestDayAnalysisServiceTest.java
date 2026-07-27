package com.storepricetrack.store_price_track.modules.reports.service;

import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import com.storepricetrack.store_price_track.modules.reports.dto.BestDayDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PurchasePatternDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BestDayAnalysisServiceTest {

    @Mock
    private ReceiptItemsRepository receiptItemsRepository;

    @Mock
    private ReceiptsRepository receiptsRepository;

    @InjectMocks
    private BestDayAnalysisService service;

    @Test
    void getBestDaysToBuy_ranksDayWithBelowAveragePriceFirst() {
        ProductsMasterEntity product = new ProductsMasterEntity();
        product.setId(1L);

        // Product's average across both purchases is (8 + 12) / 2 = 10
        ReceiptItemsEntity cheaperOnMonday = itemOnDayWithPrice(product, DayOfWeek.MONDAY, "8.00");
        ReceiptItemsEntity pricierOnFriday = itemOnDayWithPrice(product, DayOfWeek.FRIDAY, "12.00");
        when(receiptItemsRepository.findByProductIsNotNull()).thenReturn(List.of(cheaperOnMonday, pricierOnFriday));

        List<BestDayDTO> result = service.getBestDaysToBuy();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).dayOfWeek()).isEqualTo(DayOfWeek.MONDAY);
        assertThat(result.get(0).avgDeviationPercent()).isNegative();
        assertThat(result.get(1).dayOfWeek()).isEqualTo(DayOfWeek.FRIDAY);
        assertThat(result.get(1).avgDeviationPercent()).isPositive();
    }

    @Test
    void getPurchasePattern_countsReceiptsPerDayOfWeek_includingZeroDays() {
        LocalDate aFriday = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.FRIDAY));
        ReceiptsEntity receiptOnFriday = new ReceiptsEntity();
        receiptOnFriday.setPurchaseDate(aFriday.atTime(10, 0));
        when(receiptsRepository.findAll()).thenReturn(List.of(receiptOnFriday));

        List<PurchasePatternDTO> result = service.getPurchasePattern();

        assertThat(result).hasSize(7);
        assertThat(result.stream().filter(p -> p.dayOfWeek() == DayOfWeek.FRIDAY).findFirst().orElseThrow().receiptCount())
                .isEqualTo(1);
        assertThat(result.stream().filter(p -> p.dayOfWeek() == DayOfWeek.MONDAY).findFirst().orElseThrow().receiptCount())
                .isEqualTo(0);
    }

    private ReceiptItemsEntity itemOnDayWithPrice(ProductsMasterEntity product, DayOfWeek dayOfWeek, String price) {
        LocalDateTime date = LocalDateTime.of(2026, 7, 1, 10, 0)
                .with(TemporalAdjusters.nextOrSame(dayOfWeek));
        ReceiptsEntity receipt = new ReceiptsEntity();
        receipt.setPurchaseDate(date);
        ReceiptItemsEntity item = new ReceiptItemsEntity();
        item.setReceipt(receipt);
        item.setProduct(product);
        item.setUnitPrice(new BigDecimal(price));
        return item;
    }
}
