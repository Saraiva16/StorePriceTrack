package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceiptsServiceTest {

    @Mock
    private ReceiptsRepository receiptsRepository;

    @Mock
    private ReceiptItemsRepository receiptItemsRepository;

    @InjectMocks
    private ReceiptsService service;

    @Test
    void getById_throwsNotFound_whenReceiptDoesNotExist() {
        when(receiptsRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(1L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void getById_returnsReceiptWithItems_whenFound() {
        MarketsEntity market = new MarketsEntity();
        market.setId(1L);
        market.setName("Mercado X");
        market.setCnpj("00.000.000/0001-00");

        ReceiptsEntity receipt = new ReceiptsEntity();
        receipt.setId(10L);
        receipt.setMarket(market);
        receipt.setPurchaseDate(LocalDateTime.of(2026, 7, 1, 10, 0));
        receipt.setTotalAmount(new BigDecimal("50.00"));
        receipt.setAccessKey("ABC123");

        ReceiptItemsEntity item = new ReceiptItemsEntity();
        item.setOriginalNameOnReceipt("Arroz");
        item.setQuantity(BigDecimal.ONE);
        item.setUnitPrice(new BigDecimal("20.00"));
        item.setTotalPrice(new BigDecimal("20.00"));

        when(receiptsRepository.findById(10L)).thenReturn(Optional.of(receipt));
        when(receiptItemsRepository.findByReceiptId(10L)).thenReturn(List.of(item));

        ReceiptResponseDTO result = service.getById(10L);

        assertThat(result.market_name()).isEqualTo("Mercado X");
        assertThat(result.items()).hasSize(1);
        assertThat(result.items().get(0).originalName()).isEqualTo("Arroz");
    }

    @Test
    void getRecent_delegatesToRepositoryWithComputedDateRange() {
        when(receiptsRepository.findByPurchaseDateBetween(any(), any())).thenReturn(List.of());

        service.getRecent(3);

        verify(receiptsRepository).findByPurchaseDateBetween(any(LocalDateTime.class), any(LocalDateTime.class));
    }
}
