package com.storepricetrack.store_price_track.modules.receipts.ai;

public interface ReceiptExtractionClient {

    ReceiptExtractionResult extract(byte[] imageBytes, String mimeType);
}
