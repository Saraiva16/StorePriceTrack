package com.storepricetrack.store_price_track.modules.receipts.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;

public record ReceiptResponseDTO(
        String market_name,
        String cnpj,
        LocalDateTime purchase_date,
        BigDecimal total_amount,
        String access_key,
        List<ReceiptItemDTO> items
) {
}
