package com.storepricetrack.store_price_track.modules.receipts.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class NfceItemNormalizerServiceTest {

    private NfceItemNormalizerService normalizerService;

    @BeforeEach
    void setUp() {
        normalizerService = new NfceItemNormalizerService();
    }

    @Test
    @DisplayName("Deve normalizar ALFAC AMER CAIS para ALFACE AMERICANA removendo código técnico")
    void testNormalizeAlfaceAmericana() {
        var result = normalizerService.normalize("ALFAC AMER CAIS", "UN");

        assertEquals("ALFACE AMERICANA", result.normalizedName());
        assertEquals("un", result.unitMeasure());
    }

    @Test
    @DisplayName("Deve expandir L. CONDENS para LEITE CONDENSADO e identificar marca Moça")
    void testNormalizeLeiteCondensado() {
        var result = normalizerService.normalize("L. CONDENS MOCA TP 395G", "UN");

        assertTrue(result.normalizedName().contains("LEITE"));
        assertTrue(result.normalizedName().contains("CONDENSADO"));
        assertEquals("Moca", result.brand());
        assertEquals("un", result.unitMeasure());
    }

    @Test
    @DisplayName("Deve expandir REFRIG COCA COLA para REFRIGERANTE COCA COLA e identificar marca")
    void testNormalizeRefrigerante() {
        var result = normalizerService.normalize("REFRIG COCA COLA 2L", "UN");

        assertTrue(result.normalizedName().contains("REFRIGERANTE"));
        assertEquals("Coca Cola", result.brand());
    }

    @Test
    @DisplayName("Deve mapear unidade KG corretamente e limpar KG avulso no fim do nome")
    void testNormalizeKg() {
        var result = normalizerService.normalize("ABACAXI PEROLA KG", "KG");

        assertEquals("kg", result.unitMeasure());
        assertEquals("ABACAXI PEROLA", result.normalizedName());
    }

    @Test
    @DisplayName("Deve tratar abreviações de limpeza e higiene")
    void testNormalizeLimpeza() {
        var result = normalizerService.normalize("SAB DOVE 90G", "UN");

        assertTrue(result.normalizedName().contains("SABONETE"));
        assertEquals("Dove", result.brand());
    }

    @Test
    @DisplayName("Deve normalizar hortifrúti abreviado (TOM IT e BAN PRAT)")
    void testNormalizeHortifrutiGeral() {
        var tom = normalizerService.normalize("TOMAT ITALIANO KG", "KG");
        assertEquals("TOMATE ITALIANO", tom.normalizedName());
        assertEquals("kg", tom.unitMeasure());

        var ban = normalizerService.normalize("BAN PRAT KG", "KG");
        assertEquals("BANANA PRATA", ban.normalizedName());
        assertEquals("kg", ban.unitMeasure());
    }
}
