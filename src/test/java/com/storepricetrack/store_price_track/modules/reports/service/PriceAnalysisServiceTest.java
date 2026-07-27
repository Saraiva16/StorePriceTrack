package com.storepricetrack.store_price_track.modules.reports.service;

import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.reports.dto.MarketPriceComparisonDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PriceTrendPointDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.ProductPriceDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PriceAnalysisServiceTest {

    @Mock
    private ReceiptItemsRepository repository;

    @InjectMocks
    private PriceAnalysisService service;

    @Test
    void getPriceTrend_groupsAndAveragesByMonth() {
        when(repository.findByProductId(1L)).thenReturn(List.of(
                itemWithDateAndPrice(LocalDateTime.of(2026, 6, 5, 10, 0), "10.00"),
                itemWithDateAndPrice(LocalDateTime.of(2026, 6, 20, 10, 0), "12.00"),
                itemWithDateAndPrice(LocalDateTime.of(2026, 7, 3, 10, 0), "20.00")
        ));

        List<PriceTrendPointDTO> trend = service.getPriceTrend(1L);

        assertThat(trend).hasSize(2);
        assertThat(trend.get(0).period()).isEqualTo(YearMonth.of(2026, 6));
        assertThat(trend.get(0).avgPrice()).isEqualByComparingTo("11.00");
        assertThat(trend.get(1).period()).isEqualTo(YearMonth.of(2026, 7));
        assertThat(trend.get(1).avgPrice()).isEqualByComparingTo("20.00");
    }

    @Test
    void compareMarkets_ranksMarketsByAveragePriceAscending() {
        MarketsEntity marketA = marketWithId(1L, "Mercado Caro");
        MarketsEntity marketB = marketWithId(2L, "Mercado Barato");
        when(repository.findByProductId(1L)).thenReturn(List.of(
                itemWithMarketAndPrice(marketA, "20.00"),
                itemWithMarketAndPrice(marketB, "10.00")
        ));

        List<MarketPriceComparisonDTO> result = service.compareMarkets(1L);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).marketName()).isEqualTo("Mercado Barato");
        assertThat(result.get(1).marketName()).isEqualTo("Mercado Caro");
    }

    @Test
    void getCheapestProducts_returnsProductsOrderedByAveragePriceAscending() {
        ProductsMasterEntity cheap = productWithId(1L, "Arroz");
        ProductsMasterEntity expensive = productWithId(2L, "Carne");
        when(repository.findByProductIsNotNull()).thenReturn(List.of(
                itemWithProductAndPrice(cheap, "5.00"),
                itemWithProductAndPrice(expensive, "40.00")
        ));

        List<ProductPriceDTO> result = service.getCheapestProducts(10);

        assertThat(result).hasSize(2);
        assertThat(result.get(0).productName()).isEqualTo("Arroz");
        assertThat(result.get(1).productName()).isEqualTo("Carne");
    }

    private ReceiptItemsEntity itemWithDateAndPrice(LocalDateTime date, String price) {
        ReceiptsEntity receipt = new ReceiptsEntity();
        receipt.setPurchaseDate(date);
        ReceiptItemsEntity item = new ReceiptItemsEntity();
        item.setReceipt(receipt);
        item.setUnitPrice(new BigDecimal(price));
        return item;
    }

    private ReceiptItemsEntity itemWithMarketAndPrice(MarketsEntity market, String price) {
        ReceiptsEntity receipt = new ReceiptsEntity();
        receipt.setMarket(market);
        ReceiptItemsEntity item = new ReceiptItemsEntity();
        item.setReceipt(receipt);
        item.setUnitPrice(new BigDecimal(price));
        return item;
    }

    private ReceiptItemsEntity itemWithProductAndPrice(ProductsMasterEntity product, String price) {
        ReceiptItemsEntity item = new ReceiptItemsEntity();
        item.setProduct(product);
        item.setUnitPrice(new BigDecimal(price));
        return item;
    }

    private MarketsEntity marketWithId(Long id, String name) {
        MarketsEntity m = new MarketsEntity();
        m.setId(id);
        m.setName(name);
        return m;
    }

    private ProductsMasterEntity productWithId(Long id, String name) {
        ProductsMasterEntity p = new ProductsMasterEntity();
        p.setId(id);
        p.setNormalizedName(name);
        return p;
    }
}
