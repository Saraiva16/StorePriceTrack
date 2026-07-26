package com.storepricetrack.store_price_track.modules.receipts.exception;

public class DuplicateReceiptException extends RuntimeException {

    public DuplicateReceiptException(String message) {
        super(message);
    }
}
