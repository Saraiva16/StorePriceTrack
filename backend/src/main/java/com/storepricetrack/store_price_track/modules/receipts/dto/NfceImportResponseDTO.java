package com.storepricetrack.store_price_track.modules.receipts.dto;

public record NfceImportResponseDTO(
        boolean queued,
        String message,
        String stateUf,
        ReceiptResponseDTO receipt
) {
    public static NfceImportResponseDTO imported(ReceiptResponseDTO receipt) {
        return new NfceImportResponseDTO(false, "Nota fiscal importada com sucesso!", null, receipt);
    }

    public static NfceImportResponseDTO queued(String stateUf, String message) {
        return new NfceImportResponseDTO(true, message, stateUf, null);
    }
}

