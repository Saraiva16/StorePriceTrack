package com.storepricetrack.store_price_track.modules.receipts.parser;

import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;

public interface INfceParser {

    /**
     * Retorna a UF (estado) suportada pelo parser (ex: "SP", "RJ").
     */
    String getSupportedUf();

    /**
     * Verifica se este parser suporta a URL fornecida.
     */
    boolean supports(String url);

    /**
     * Realiza o scraping da página ou o parsing do HTML da NFC-e.
     */
    ReceiptExtractionResult parse(String url);

    /**
     * Realiza o parsing a partir de uma String HTML já baixada (útil para testes e mocks).
     */
    ReceiptExtractionResult parseHtml(String html, String sourceUrl);
}

