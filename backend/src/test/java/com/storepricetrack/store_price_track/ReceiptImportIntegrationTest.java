package com.storepricetrack.store_price_track;

import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionClient;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult.ReceiptExtractionItem;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import com.storepricetrack.store_price_track.modules.receipts.service.IReceiptImportService;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Exercises the full Spring wiring (services, repositories, real MySQL schema) for the
 * import flow. Only the external Gemini call is mocked. {@code @Transactional} rolls
 * back everything this test persists, so it never leaves data behind in the dev database.
 */
@SpringBootTest
@Transactional
class ReceiptImportIntegrationTest {

    @Autowired
    private IReceiptImportService receiptImportService;

    @Autowired
    private ReceiptsRepository receiptsRepository;

    @MockitoBean
    private ReceiptExtractionClient extractionClient;

    @Test
    void importReceipt_persistsReceiptMarketAndItems_endToEnd() {
        ReceiptExtractionResult extraction = new ReceiptExtractionResult(
                "Mercado Integracao", "11.111.111/0001-11", "Rua Teste", "SP",
                "2026-07-20T15:30:00", new BigDecimal("15.90"), "INTEGRATION-TEST-0001",
                List.of(new ReceiptExtractionItem(
                        "Item Teste", BigDecimal.ONE, new BigDecimal("15.90"), new BigDecimal("15.90"))));
        Mockito.when(extractionClient.extract(Mockito.any(), Mockito.any())).thenReturn(extraction);

        MockMultipartFile file = new MockMultipartFile("file", "nota.jpg", "image/jpeg", new byte[]{1, 2, 3});

        ReceiptResponseDTO response = receiptImportService.importReceipt(file);

        assertThat(response.market_name()).isEqualTo("Mercado Integracao");
        assertThat(response.items()).hasSize(1);
        assertThat(receiptsRepository.findByAccessKey("INTEGRATION-TEST-0001")).isPresent();
    }
}
