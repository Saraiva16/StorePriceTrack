package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.markets.dto.MarketDTO;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import com.storepricetrack.store_price_track.modules.markets.service.IMarketsService;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptImportQueueEntity;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptImportQueueRepository;
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
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
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
    private final ProductsMasterRepository productsMasterRepository;
    private final CategoriesRepository categoriesRepository;
    private final ReceiptImportQueueRepository queueRepository;

    @Override
    @Caching(evict = {
            @CacheEvict(value = "priceStats", allEntries = true),
            @CacheEvict(value = "topProducts", allEntries = true),
            @CacheEvict(value = "priceTrend", allEntries = true),
            @CacheEvict(value = "marketComparison", allEntries = true),
            @CacheEvict(value = "cheapestProducts", allEntries = true),
            @CacheEvict(value = "mostExpensiveProducts", allEntries = true),
            @CacheEvict(value = "bestShoppingDays", allEntries = true),
            @CacheEvict(value = "purchasePattern", allEntries = true)
    })
    public ReceiptResponseDTO importReceipt(MultipartFile file) {
        if (file.isEmpty()) {
            throw new ReceiptExtractionException("Arquivo de imagem vazio");
        }
        byte[] bytes = readBytes(file);
        String mimeType = Optional.ofNullable(file.getContentType()).orElse("image/jpeg");

        ReceiptExtractionResult extraction;
        try {
            extraction = extractionClient.extract(bytes, mimeType);
        } catch (ReceiptExtractionException e) {
            if (e.getMessage() != null && e.getMessage().contains("503")) {
                log.warn("AI 503 Error. Saving receipt to background queue...");
                ReceiptImportQueueEntity queueItem = new ReceiptImportQueueEntity();
                queueItem.setImageBytes(bytes);
                queueItem.setMimeType(mimeType);
                queueItem.setErrorMessage(e.getMessage());
                queueItem.setStatus("PENDING");
                queueRepository.save(queueItem);
            }
            throw e;
        }

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
        
        Long productId = findConfidentProductMatch(item.name())
                .orElseGet(() -> createNewProductMaster(item.name(), item.category()));
                
        if (productId != null) {
            entity.setProduct(productsMasterRepository.getReferenceById(productId));
        }
        return entity;
    }

    private Long createNewProductMaster(String name, String categoryName) {
        if (name == null || name.isBlank()) return null;
        String normalized = name.trim().toUpperCase();

        return productsMasterRepository.findFirstByNormalizedNameIgnoreCase(normalized)
                .map(com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity::getId)
                .orElseGet(() -> {
                    com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity newProduct = 
                            new com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity();
                    newProduct.setNormalizedName(normalized);
                    newProduct.setUnitMeasure("un");
                    
                    if (categoryName != null && !categoryName.isBlank()) {
                        String cleanCat = categoryName.trim();
                        CategoriesEntity cat = categoriesRepository.findByName(cleanCat)
                            .orElseGet(() -> {
                                CategoriesEntity newCat = new CategoriesEntity();
                                newCat.setName(cleanCat);
                                return categoriesRepository.save(newCat);
                            });
                        newProduct.setCategory(cat);
                    }
                    
                    log.info("Auto-creating new Product Master for: {} in category: {}", normalized, categoryName);
                    return productsMasterRepository.save(newProduct).getId();
                });
    }

    private Optional<Long> findConfidentProductMatch(String originalNameOnReceipt) {
        if (originalNameOnReceipt == null || originalNameOnReceipt.isBlank()) {
            return Optional.empty();
        }
        return receiptItemsRepository
                .findFirstByOriginalNameOnReceiptIgnoreCaseAndProductIsNotNull(originalNameOnReceipt)
                .map(existing -> {
                    Long productId = existing.getProduct().getId();
                    log.debug("Confident match: '{}' -> product {}", originalNameOnReceipt, productId);
                    return productId;
                });
    }

    private ReceiptResponseDTO toResponseDTO(ReceiptsEntity receipt, MarketDTO market, List<ReceiptItemsEntity> items) {
        List<ReceiptItemDTO> itemDTOs = items.stream()
                .map(i -> new ReceiptItemDTO(i.getOriginalNameOnReceipt(), i.getQuantity(), i.getUnitPrice(), i.getTotalPrice(),
                        i.getProduct() != null ? i.getProduct().getId() : null))
                .toList();
        return new ReceiptResponseDTO(
                receipt.getId(), market.name(), market.cnpj(), receipt.getPurchaseDate(), receipt.getTotalAmount(), receipt.getAccessKey(), itemDTOs);
    }
}
