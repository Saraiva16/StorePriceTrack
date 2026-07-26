package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.markets.dto.MarketDTO;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import com.storepricetrack.store_price_track.modules.markets.service.IMarketsService;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionClient;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionException;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult.ReceiptExtractionItem;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.exception.DuplicateReceiptException;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class ReceiptImportService implements IReceiptImportService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptImportService.class);

    private final ReceiptExtractionClient extractionClient;
    private final ReceiptsRepository receiptsRepository;
    private final ReceiptItemsRepository receiptItemsRepository;
    private final MarketsRepository marketsRepository;
    private final IMarketsService marketsService;

    @Override
    public ReceiptResponseDTO importReceipt(MultipartFile file) {
        byte[] bytes = readBytes(file);
        String mimeType = Optional.ofNullable(file.getContentType()).orElse("image/jpeg");

        ReceiptExtractionResult extraction = extractionClient.extract(bytes, mimeType);

        if (extraction.accessKey() != null && receiptsRepository.findByAccessKey(extraction.accessKey()).isPresent()) {
            throw new DuplicateReceiptException("Recibo já importado (access_key: " + extraction.accessKey() + ")");
        }

        MarketDTO market = marketsService.findOrCreateByCnpj(
                extraction.cnpj(), extraction.marketName(), extraction.address(), extraction.cityUf());

        ReceiptsEntity receipt = new ReceiptsEntity();
        receipt.setMarket(marketsRepository.getReferenceById(market.id()));
        receipt.setPurchaseDate(parsePurchaseDate(extraction.purchaseDate()));
        receipt.setTotalAmount(extraction.totalAmount());
        receipt.setAccessKey(extraction.accessKey());
        ReceiptsEntity savedReceipt = receiptsRepository.save(receipt);

        List<ReceiptExtractionItem> extractedItems = Optional.ofNullable(extraction.items()).orElse(List.of());
        List<ReceiptItemsEntity> items = extractedItems.stream()
                .map(item -> toItemEntity(savedReceipt, item))
                .toList();
        receiptItemsRepository.saveAll(items);

        log.info("Receipt imported with id {} for market {}", savedReceipt.getId(), market.name());

        return toResponseDTO(savedReceipt, market, items);
    }

    private byte[] readBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new ReceiptExtractionException("Não foi possível ler o arquivo da nota fiscal", e);
        }
    }

    private LocalDateTime parsePurchaseDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(rawDate);
        } catch (DateTimeParseException e) {
            return LocalDate.parse(rawDate).atStartOfDay();
        }
    }

    private ReceiptItemsEntity toItemEntity(ReceiptsEntity receipt, ReceiptExtractionItem item) {
        ReceiptItemsEntity entity = new ReceiptItemsEntity();
        entity.setReceipt(receipt);
        entity.setOriginalNameOnReceipt(item.name());
        entity.setQuantity(item.quantity());
        entity.setUnitPrice(item.unitPrice());
        entity.setTotalPrice(item.totalPrice() != null ? item.totalPrice() : item.quantity().multiply(item.unitPrice()));
        return entity;
    }

    private ReceiptResponseDTO toResponseDTO(ReceiptsEntity receipt, MarketDTO market, List<ReceiptItemsEntity> items) {
        List<ReceiptItemDTO> itemDTOs = items.stream()
                .map(i -> new ReceiptItemDTO(i.getOriginalNameOnReceipt(), i.getQuantity(), i.getUnitPrice(), i.getTotalPrice()))
                .toList();
        return new ReceiptResponseDTO(
                market.name(), market.cnpj(), receipt.getPurchaseDate(), receipt.getTotalAmount(), receipt.getAccessKey(), itemDTOs);
    }
}
