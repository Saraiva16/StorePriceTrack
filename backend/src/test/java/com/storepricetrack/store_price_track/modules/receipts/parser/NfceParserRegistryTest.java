package com.storepricetrack.store_price_track.modules.receipts.parser;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class NfceParserRegistryTest {

    private final SpNfceParser spParser = new SpNfceParser();
    private final NfceParserRegistry registry = new NfceParserRegistry(List.of(spParser));

    @Test
    @DisplayName("Deve detectar UF a partir do domínio da URL")
    void shouldDetectUfFromDomain() {
        assertThat(registry.detectUf("https://www.nfce.fazenda.sp.gov.br/consulta")).isEqualTo("SP");
        assertThat(registry.detectUf("https://nfce.fazenda.mg.gov.br/portalnfce")).isEqualTo("MG");
        assertThat(registry.detectUf("https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx")).isEqualTo("RS");
        assertThat(registry.detectUf("https://google.com/test")).isEqualTo("UNKNOWN");
    }

    @Test
    @DisplayName("Deve encontrar o parser correto quando suportado")
    void shouldFindParserWhenSupported() {
        Optional<INfceParser> parser = registry.findParser("https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=123");
        assertThat(parser).isPresent();
        assertThat(parser.get().getSupportedUf()).isEqualTo("SP");
    }

    @Test
    @DisplayName("Deve retornar vazio quando o parser do estado não existir")
    void shouldReturnEmptyWhenParserNotSupported() {
        Optional<INfceParser> parser = registry.findParser("https://nfce.fazenda.mg.gov.br/portalnfce");
        assertThat(parser).isEmpty();
    }
}

