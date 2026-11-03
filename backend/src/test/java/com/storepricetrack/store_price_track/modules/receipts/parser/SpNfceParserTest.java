package com.storepricetrack.store_price_track.modules.receipts.parser;

import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;

class SpNfceParserTest {

    private final SpNfceParser parser = new SpNfceParser();

    @Test
    @DisplayName("Deve suportar URLs da SEFAZ SP")
    void shouldSupportSefazSpUrls() {
        assertThat(parser.supports("https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=..."))
                .isTrue();
        assertThat(parser.supports("https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx"))
                .isFalse();
    }

    @Test
    @DisplayName("Deve extrair com perfeição dados do HTML real da SEFAZ SP")
    void shouldParseRealSefazSpHtmlFixture() throws IOException {
        ClassPathResource resource = new ClassPathResource("fixtures/sp_nfce_sample.html");
        String html = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);

        String sampleUrl = "https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=35261171779813001060650310000090491002655108|2|1|1|9225E44DDAB451C2D9768937956CD3B44E6CF12D";
        ReceiptExtractionResult result = parser.parseHtml(html, sampleUrl);

        assertThat(result).isNotNull();
        assertThat(result.marketName()).isEqualTo("SUPERMERCADO X LTDA FILIAL");
        assertThat(result.cnpj()).isEqualTo("71.779.813/0010-60");
        assertThat(result.totalAmount()).isEqualByComparingTo(new BigDecimal("24.87"));
        assertThat(result.accessKey()).isEqualTo("35261171779813001060650310000090491002655108");

        // Validando itens
        assertThat(result.items()).hasSize(3);

        var item1 = result.items().get(0);
        assertThat(item1.name()).isEqualTo("REQ NESTLE LIGH");
        assertThat(item1.quantity()).isEqualByComparingTo(new BigDecimal("1"));
        assertThat(item1.unitPrice()).isEqualByComparingTo(new BigDecimal("8.89"));
        assertThat(item1.totalPrice()).isEqualByComparingTo(new BigDecimal("8.89"));

        var item2 = result.items().get(1);
        assertThat(item2.name()).isEqualTo("B.MONSTER MANGO");
        assertThat(item2.quantity()).isEqualByComparingTo(new BigDecimal("1"));
        assertThat(item2.unitPrice()).isEqualByComparingTo(new BigDecimal("7.99"));
        assertThat(item2.totalPrice()).isEqualByComparingTo(new BigDecimal("7.99"));

        var item3 = result.items().get(2);
        assertThat(item3.name()).isEqualTo("ENERG MONSTER 4");
        assertThat(item3.quantity()).isEqualByComparingTo(new BigDecimal("1"));
        assertThat(item3.unitPrice()).isEqualByComparingTo(new BigDecimal("7.99"));
        assertThat(item3.totalPrice()).isEqualByComparingTo(new BigDecimal("7.99"));
    }
}

