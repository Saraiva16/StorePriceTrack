package com.storepricetrack.store_price_track.modules.receipt_items.service;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.PriceStatsDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceiptItemsServiceTest {

    @Mock
    private ReceiptItemsRepository repository;

    @InjectMocks
    private ReceiptItemsService service;

    @Test
    void getPriceStats_returnsNulls_whenNoDataExists() {
        when(repository.findMinUnitPriceByProductId(1L)).thenReturn(Optional.empty());
        when(repository.findMaxUnitPriceByProductId(1L)).thenReturn(Optional.empty());
        when(repository.findAverageUnitPriceByProductId(1L)).thenReturn(Optional.empty());

        PriceStatsDTO result = service.getPriceStats(1L);

        assertThat(result.minPrice()).isNull();
        assertThat(result.avgPrice()).isNull();
        assertThat(result.maxPrice()).isNull();
    }

    @Test
    void getPriceStats_roundsAveragePriceToTwoDecimals() {
        when(repository.findMinUnitPriceByProductId(1L)).thenReturn(Optional.of(new BigDecimal("5.00")));
        when(repository.findMaxUnitPriceByProductId(1L)).thenReturn(Optional.of(new BigDecimal("7.00")));
        when(repository.findAverageUnitPriceByProductId(1L)).thenReturn(Optional.of(6.5));

        PriceStatsDTO result = service.getPriceStats(1L);

        assertThat(result.avgPrice()).isEqualByComparingTo("6.50");
    }

    @Test
    void getTopProducts_delegatesToRepositoryWithPageable() {
        when(repository.findTopProducts(any())).thenReturn(List.of());

        service.getTopProducts(5);

        verify(repository).findTopProducts(PageRequest.of(0, 5));
    }
}
