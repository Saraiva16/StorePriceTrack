package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import org.springframework.web.multipart.MultipartFile;

public interface IReceiptImportService {

    ReceiptResponseDTO importReceipt(MultipartFile file);
}
