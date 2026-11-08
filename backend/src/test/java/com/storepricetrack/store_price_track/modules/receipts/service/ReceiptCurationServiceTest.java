package com.storepricetrack.store_price_track.modules.receipts.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult.ReceiptExtractionItem;
import com.storepricetrack.store_price_track.modules.receipts.dto.NfcePreviewResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptCurationRepository;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ReceiptCurationServiceTest {

    private List<ReceiptItemsEntity> mockHistoricalMatches;
    private ReceiptCurationService curationService;

    @BeforeEach
    void setUp() {
        mockHistoricalMatches = new ArrayList<>();

        ReceiptItemsRepository receiptItemsRepo = createProxy(ReceiptItemsRepository.class, (proxy, method, args) -> {
            if ("findHistoricalMatchesByOriginalNames".equals(method.getName())) {
                return mockHistoricalMatches;
            }
            return null;
        });

        ReceiptCurationRepository curationRepo = createProxy(ReceiptCurationRepository.class, (proxy, method, args) -> null);
        ReceiptsRepository receiptsRepo = createProxy(ReceiptsRepository.class, (proxy, method, args) -> null);
        MarketsRepository marketsRepo = createProxy(MarketsRepository.class, (proxy, method, args) -> null);
        ProductsMasterRepository productsMasterRepo = createProxy(ProductsMasterRepository.class, (proxy, method, args) -> null);
        CategoriesRepository categoriesRepo = createProxy(CategoriesRepository.class, (proxy, method, args) -> null);

        NfceItemNormalizerService normalizerService = new NfceItemNormalizerService();
        com.storepricetrack.store_price_track.modules.notifications.service.NotificationService dummyNotificationService = 
                new com.storepricetrack.store_price_track.modules.notifications.service.NotificationService(null, null, null, null, null) {
                    @Override
                    public void notifyAdminsOfNewReceipt(com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptCurationEntity curation) {}
                };

        curationService = new ReceiptCurationService(
                curationRepo,
                receiptsRepo,
                receiptItemsRepo,
                marketsRepo,
                productsMasterRepo,
                categoriesRepo,
                normalizerService,
                dummyNotificationService,
                new ObjectMapper()
        );
    }

    @SuppressWarnings("unchecked")
    private <T> T createProxy(Class<T> interfaceClass, java.lang.reflect.InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(
                interfaceClass.getClassLoader(),
                new Class<?>[]{interfaceClass},
                handler
        );
    }

    @Test
    @DisplayName("Deve reaproveitar produto histórico curado previamente (mecanismo de memória De-Para) e converter para MAIÚSCULAS")
    void deveReaproveitarProdutoHistoricoEmMaiusculas() {
        String rawName = "F MIG SUI RESE FC";

        ProductsMasterEntity learnedProduct = new ProductsMasterEntity();
        learnedProduct.setId(10L);
        learnedProduct.setNormalizedName("file mignon suino reserva"); // intencionalmente minúsculo para testar enforce
        learnedProduct.setBrand("Seara");
        learnedProduct.setUnitMeasure("kg");
        CategoriesEntity cat = new CategoriesEntity();
        cat.setName("Carnes e Aves");
        learnedProduct.setCategory(cat);

        ReceiptItemsEntity historicalItem = new ReceiptItemsEntity();
        historicalItem.setId(99L);
        historicalItem.setOriginalNameOnReceipt(rawName);
        historicalItem.setProduct(learnedProduct);

        mockHistoricalMatches.add(historicalItem);

        ReceiptExtractionResult extraction = new ReceiptExtractionResult(
                "Supermercado Teste",
                "12.345.678/0001-90",
                "Rua Teste, 100",
                "São Paulo - SP",
                "2026-10-12T15:21:00",
                new BigDecimal("50.00"),
                "35241012345678000190650010000000011000000010",
                List.of(
                        new ReceiptExtractionItem(rawName, "Carnes", new BigDecimal("1.5"), new BigDecimal("30.00"), new BigDecimal("45.00"))
                )
        );

        NfcePreviewResponseDTO preview = curationService.buildPreview(extraction, "https://fake-nfce-url");

        assertNotNull(preview);
        assertEquals(1, preview.items().size());
        var item = preview.items().get(0);

        assertEquals(rawName, item.originalName());
        assertEquals("FILE MIGNON SUINO RESERVA", item.normalizedName());
        assertEquals("Seara", item.brand());
        assertEquals("kg", item.unitMeasure());
        assertEquals("Carnes e Aves", item.category());
    }

    @Test
    @DisplayName("Quando item não existe no histórico, deve recorrer ao algoritmo de normalização com resultado em MAIÚSCULAS")
    void deveRecorrerAoNormalizerQuandoItemNaoTemHistorico() {
        mockHistoricalMatches.clear();

        ReceiptExtractionResult extraction = new ReceiptExtractionResult(
                "Supermercado Teste",
                "12.345.678/0001-90",
                "Rua Teste, 100",
                "São Paulo - SP",
                "2026-10-12T15:21:00",
                new BigDecimal("10.00"),
                "35241012345678000190650010000000011000000010",
                List.of(
                        new ReceiptExtractionItem("ALFAC AMER CAIS", "FLV", BigDecimal.ONE, new BigDecimal("4.50"), new BigDecimal("4.50"))
                )
        );

        NfcePreviewResponseDTO preview = curationService.buildPreview(extraction, "https://fake-nfce-url");

        assertNotNull(preview);
        assertEquals(1, preview.items().size());
        var item = preview.items().get(0);

        assertEquals("ALFAC AMER CAIS", item.originalName());
        assertEquals("ALFACE AMERICANA", item.normalizedName());
    }
}
