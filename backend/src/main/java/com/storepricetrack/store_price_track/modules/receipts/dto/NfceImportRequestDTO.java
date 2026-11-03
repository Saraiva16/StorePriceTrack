package com.storepricetrack.store_price_track.modules.receipts.dto;

import jakarta.validation.constraints.NotBlank;
import org.hibernate.validator.constraints.URL;

public record NfceImportRequestDTO(
        @NotBlank(message = "A URL da NFC-e é obrigatória")
        @URL(message = "URL inválida")
        String url
) {
}

