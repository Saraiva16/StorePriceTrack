package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.markets.dto.MarketDTO;
import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import com.storepricetrack.store_price_track.modules.markets.service.IMarketsService;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionClient;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionException;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult.ReceiptExtractionItem;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.exception.DuplicateReceiptException;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReceiptImportServiceTest {

    @Mock
    private ReceiptExtractionClient extractionClient;

    @Mock
    private ReceiptsRepository receiptsRepository;

    @Mock
    private ReceiptItemsRepository receiptItemsRepository;

    @Mock
    private MarketsRepository marketsRepository;

    @Mock
    private IMarketsService marketsService;

    @Mock
    private ProductsMasterRepository productsMasterRepository;

    @Mock
    private com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository categoriesRepository;

    @Captor
    private org.mockito.ArgumentCaptor<List<ReceiptItemsEntity>> itemsCaptor;

    @InjectMocks
    private ReceiptImportService service;

    @Test
    void importReceipt_throwsExtractionException_whenFileIsEmpty() {
        MultipartFile emptyFile = new MockMultipartFile("file", "empty.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> service.importReceipt(emptyFile))
                .isInstanceOf(ReceiptExtractionException.class);
        verifyNoInteractions(extractionClient);
    }

    @Test
    void importReceipt_throwsDuplicateException_whenAccessKeyAlreadyExists() {
        MultipartFile file = new MockMultipartFile("file", "nota.jpg", "image/jpeg", new byte[]{1, 2, 3});
        ReceiptExtractionResult extraction = new ReceiptExtractionResult(
                "Mercado X", "00.000.000/0001-00", null, null, "2026-07-01T10:00:00",
                new BigDecimal("50.00"), "ABC123", List.of());
        when(extractionClient.extract(any(), any())).thenReturn(extraction);
        when(receiptsRepository.findByAccessKey("ABC123")).thenReturn(Optional.of(new ReceiptsEntity()));

        assertThatThrownBy(() -> service.importReceipt(file))
                .isInstanceOf(DuplicateReceiptException.class);
        verify(receiptsRepository, never()).save(any());
    }

    @Test
    void importReceipt_persistsReceiptAndAutoLinksProduct_onConfidentMatch() {
        MultipartFile file = new MockMultipartFile("file", "nota.jpg", "image/jpeg", new byte[]{1, 2, 3});
        ReceiptExtractionItem extractedItem =
                new ReceiptExtractionItem("Leite", "Outros", BigDecimal.ONE, new BigDecimal("5.00"), new BigDecimal("5.00"));
        ReceiptExtractionResult extraction = new ReceiptExtractionResult(
                "Mercado X", "00.000.000/0001-00", "Rua 1", "SP", "2026-07-01T10:00:00",
                new BigDecimal("5.00"), "XYZ789", List.of(extractedItem));

        when(extractionClient.extract(any(), any())).thenReturn(extraction);
        when(receiptsRepository.findByAccessKey("XYZ789")).thenReturn(Optional.empty());
        when(marketsService.findOrCreateByCnpj(any(), any(), any(), any()))
                .thenReturn(new MarketDTO(1L, "Mercado X", "00.000.000/0001-00", "Rua 1", "SP"));
        when(marketsRepository.getReferenceById(1L)).thenReturn(new MarketsEntity());
        when(receiptsRepository.save(any(ReceiptsEntity.class))).thenAnswer(inv -> {
            ReceiptsEntity r = inv.getArgument(0);
            r.setId(100L);
            return r;
        });

        ProductsMasterEntity existingProduct = new ProductsMasterEntity();
        existingProduct.setId(7L);
        ReceiptItemsEntity previouslyLinkedItem = new ReceiptItemsEntity();
        previouslyLinkedItem.setProduct(existingProduct);
        when(receiptItemsRepository.findFirstByOriginalNameOnReceiptIgnoreCaseAndProductIsNotNull("Leite"))
                .thenReturn(Optional.of(previouslyLinkedItem));
        when(productsMasterRepository.getReferenceById(7L)).thenReturn(existingProduct);

        ReceiptResponseDTO response = service.importReceipt(file);

        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).productId()).isEqualTo(7L);

        verify(receiptItemsRepository).saveAll(itemsCaptor.capture());
        assertThat(itemsCaptor.getValue()).hasSize(1);
        assertThat(itemsCaptor.getValue().get(0).getProduct()).isEqualTo(existingProduct);
    }

    @Test
    void importReceipt_computesTotalPrice_whenAiOmitsIt() {
        MultipartFile file = new MockMultipartFile("file", "nota.jpg", "image/jpeg", new byte[]{1, 2, 3});
        ReceiptExtractionItem itemWithoutTotal =
                new ReceiptExtractionItem("Arroz", "Outros", new BigDecimal("2"), new BigDecimal("10.00"), null);
        ReceiptExtractionResult extraction = new ReceiptExtractionResult(
                "Mercado X", "00.000.000/0001-00", null, null, "2026-07-01T10:00:00",
                new BigDecimal("20.00"), "NOTOTAL01", List.of(itemWithoutTotal));

        when(extractionClient.extract(any(), any())).thenReturn(extraction);
        when(receiptsRepository.findByAccessKey("NOTOTAL01")).thenReturn(Optional.empty());
        when(marketsService.findOrCreateByCnpj(any(), any(), any(), any()))
                .thenReturn(new MarketDTO(1L, "Mercado X", "00.000.000/0001-00", null, null));
        when(marketsRepository.getReferenceById(1L)).thenReturn(new MarketsEntity());
        when(receiptsRepository.save(any(ReceiptsEntity.class))).thenAnswer(inv -> inv.getArgument(0));
        when(receiptItemsRepository.findFirstByOriginalNameOnReceiptIgnoreCaseAndProductIsNotNull(any()))
                .thenReturn(Optional.empty());
        when(productsMasterRepository.save(any())).thenAnswer(inv -> {
            ProductsMasterEntity p = inv.getArgument(0);
            p.setId(99L);
            return p;
        });

        ReceiptResponseDTO response = service.importReceipt(file);

        assertThat(response.items().get(0).totalPrice()).isEqualByComparingTo("20.00");
    }
}
