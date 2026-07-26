package com.storepricetrack.store_price_track.modules.receipts.ai;

public class ReceiptExtractionException extends RuntimeException {

    public ReceiptExtractionException(String message) {
        super(message);
    }

    public ReceiptExtractionException(String message, Throwable cause) {
        super(message, cause);
    }
}
