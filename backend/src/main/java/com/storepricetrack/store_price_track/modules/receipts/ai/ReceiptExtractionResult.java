package com.storepricetrack.store_price_track.modules.receipts.ai;

import java.math.BigDecimal;
import java.util.List;

public record ReceiptExtractionResult(
        String marketName,
        String cnpj,
        String address,
        String cityUf,
        String purchaseDate,
        BigDecimal totalAmount,
        String accessKey,
        List<ReceiptExtractionItem> items
) {

    public record ReceiptExtractionItem(
            String name,
            String category,
            BigDecimal quantity,
            BigDecimal unitPrice,
            BigDecimal totalPrice
    ) {
    }
}
