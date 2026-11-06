package com.storepricetrack.store_price_track.modules.receipts.dto;

public record NfceImportResponseDTO(
        boolean queued,
        String message,
        String stateUf,
        ReceiptResponseDTO receipt,
        NfcePreviewResponseDTO preview,
        Long curationId
) {
    public static NfceImportResponseDTO imported(ReceiptResponseDTO receipt) {
        return new NfceImportResponseDTO(false, "Nota fiscal importada com sucesso!", null, receipt, null, null);
    }

    public static NfceImportResponseDTO queued(String stateUf, String message) {
        return new NfceImportResponseDTO(true, message, stateUf, null, null, null);
    }

    public static NfceImportResponseDTO preview(NfcePreviewResponseDTO preview) {
        return new NfceImportResponseDTO(false, "Nota fiscal pronta para conferência!", null, null, preview, null);
    }

    public static NfceImportResponseDTO submittedForCuration(Long curationId, String message) {
        return new NfceImportResponseDTO(true, message, null, null, null, curationId);
    }
}
