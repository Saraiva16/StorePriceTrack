package com.storepricetrack.store_price_track.modules.receipts.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import com.storepricetrack.store_price_track.modules.notifications.service.NotificationService;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult.ReceiptExtractionItem;
import com.storepricetrack.store_price_track.modules.receipts.dto.ApproveCurationRequestDTO;
import com.storepricetrack.store_price_track.modules.receipts.dto.CurationItemDTO;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptCurationResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptCurationEntity;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.exception.DuplicateReceiptException;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptCurationRepository;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class ReceiptCurationService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptCurationService.class);

    private final ReceiptCurationRepository curationRepository;
    private final ReceiptsRepository receiptsRepository;
    private final ReceiptItemsRepository receiptItemsRepository;
    private final MarketsRepository marketsRepository;
    private final ProductsMasterRepository productsMasterRepository;
    private final CategoriesRepository categoriesRepository;
    private final NfceItemNormalizerService normalizerService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    /**
     * Constrói o preview com itens já normalizados para o usuário revisar na tela de confirmação.
     * Utiliza o mecanismo de memória histórica (De-Para aprendido de notas anteriores) antes do fallback para regex.
     */
    public com.storepricetrack.store_price_track.modules.receipts.dto.NfcePreviewResponseDTO buildPreview(ReceiptExtractionResult extraction, String sourceUrl) {
        List<CurationItemDTO> curationItems = processItemsWithMemoryAndNormalizer(extraction.items());

        return new com.storepricetrack.store_price_track.modules.receipts.dto.NfcePreviewResponseDTO(
                extraction.marketName(),
                extraction.cnpj(),
                extraction.purchaseDate(),
                extraction.totalAmount(),
                extraction.accessKey(),
                sourceUrl,
                curationItems
        );
    }

    /**
     * Usuário submete a nota revisada para a fila de curadoria.
     * Garante que os nomes normalizados pelo usuário estejam em MAIÚSCULAS.
     */
    public ReceiptCurationEntity submitUserConfirmedToCuration(com.storepricetrack.store_price_track.modules.receipts.dto.SubmitCurationRequestDTO request, User user) {
        if (request.accessKey() != null && !request.accessKey().isBlank()) {
            if (receiptsRepository.findByAccessKey(request.accessKey()).isPresent()) {
                throw new DuplicateReceiptException("Esta nota fiscal já foi importada e ativada anteriormente.");
            }
        }

        List<CurationItemDTO> sanitizedItems = (request.items() != null ? request.items() : List.<CurationItemDTO>of())
                .stream()
                .map(it -> {
                    String orig = it.originalName() != null ? it.originalName().trim() : "";
                    String norm = it.normalizedName() != null && !it.normalizedName().isBlank()
                            ? it.normalizedName().trim().toUpperCase()
                            : (orig.isBlank() ? "PRODUTO" : orig.toUpperCase());
                    return new CurationItemDTO(
                            orig,
                            norm,
                            it.brand(),
                            it.unitMeasure(),
                            it.quantity(),
                            it.unitPrice(),
                            it.totalPrice(),
                            it.category()
                    );
                })
                .toList();

        String itemsJson = serializeItems(sanitizedItems);

        ReceiptCurationEntity entity = ReceiptCurationEntity.builder()
                .user(user)
                .sourceUrl(request.sourceUrl())
                .accessKey(request.accessKey())
                .marketName(request.marketName())
                .marketCnpj(request.marketCnpj())
                .purchaseDate(parseDate(request.purchaseDate()))
                .totalAmount(request.totalAmount() != null ? request.totalAmount() : BigDecimal.ZERO)
                .status("EM_ANALISE")
                .itemsPayload(itemsJson)
                .build();

        ReceiptCurationEntity saved = curationRepository.save(entity);
        log.info("User submitted confirmed receipt to curation: accessKey={}, items={}", request.accessKey(), sanitizedItems.size());
        notificationService.notifyAdminsOfNewReceipt(saved);
        return saved;
    }

    /**
     * Submete uma nota extraída diretamente para a fila de curadoria em análise.
     */
    public ReceiptCurationEntity submitToCuration(ReceiptExtractionResult extraction, String sourceUrl, User user) {
        if (extraction.accessKey() != null && !extraction.accessKey().isBlank()) {
            if (receiptsRepository.findByAccessKey(extraction.accessKey()).isPresent()) {
                throw new DuplicateReceiptException("Esta nota fiscal já foi importada e ativada anteriormente.");
            }
        }

        List<CurationItemDTO> curationItems = processItemsWithMemoryAndNormalizer(extraction.items());
        String itemsJson = serializeItems(curationItems);

        ReceiptCurationEntity entity = ReceiptCurationEntity.builder()
                .user(user)
                .sourceUrl(sourceUrl)
                .accessKey(extraction.accessKey())
                .marketName(extraction.marketName())
                .marketCnpj(extraction.cnpj())
                .purchaseDate(parseDate(extraction.purchaseDate()))
                .totalAmount(extraction.totalAmount() != null ? extraction.totalAmount() : BigDecimal.ZERO)
                .status("EM_ANALISE")
                .itemsPayload(itemsJson)
                .build();

        ReceiptCurationEntity saved = curationRepository.save(entity);
        log.info("Auto submitted extracted receipt to curation: accessKey={}, items={}", extraction.accessKey(), curationItems.size());
        notificationService.notifyAdminsOfNewReceipt(saved);
        return saved;
    }

    /**
     * Mecanismo de Memória & Normalização:
     * 1. Consulta em lote no histórico de itens curados previamente (receipt_items).
     * 2. Se encontrar registro histórico para o nome cru do item, reutiliza o nome consolidado.
     * 3. Caso contrário, executa a normalização algorítmica (dicionários e regex).
     * 4. Enforce estrito de todas as letras em MAIÚSCULAS no nome normalizado.
     */
    private List<CurationItemDTO> processItemsWithMemoryAndNormalizer(List<ReceiptExtractionItem> rawItems) {
        if (rawItems == null || rawItems.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> rawNamesLower = rawItems.stream()
                .map(ReceiptExtractionItem::name)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.trim().toLowerCase())
                .distinct()
                .toList();

        Map<String, ProductsMasterEntity> historicalMemoryMap = new HashMap<>();
        if (!rawNamesLower.isEmpty()) {
            try {
                List<ReceiptItemsEntity> historyMatches = receiptItemsRepository.findHistoricalMatchesByOriginalNames(rawNamesLower);
                for (ReceiptItemsEntity match : historyMatches) {
                    if (match.getOriginalNameOnReceipt() != null && match.getProduct() != null) {
                        String key = match.getOriginalNameOnReceipt().trim().toLowerCase();
                        // A query está ordenada por ri.id DESC, portanto putIfAbsent preserva a curadoria mais recente
                        historicalMemoryMap.putIfAbsent(key, match.getProduct());
                    }
                }
            } catch (Exception ex) {
                log.warn("Falha ao buscar histórico de memória para itens da nota: {}", ex.getMessage());
            }
        }

        List<CurationItemDTO> curationItems = new ArrayList<>(rawItems.size());
        for (ReceiptExtractionItem item : rawItems) {
            String originalRawName = item.name() != null ? item.name().trim() : "";
            String key = originalRawName.toLowerCase();

            String normalizedName;
            String brand = "";
            String unitMeasure = item.unitMeasure() != null && !item.unitMeasure().isBlank()
                    ? item.unitMeasure().toLowerCase()
                    : "un";
            String category = item.category();

            if (!key.isEmpty() && historicalMemoryMap.containsKey(key)) {
                ProductsMasterEntity historicalProduct = historicalMemoryMap.get(key);
                normalizedName = historicalProduct.getNormalizedName() != null 
                        ? historicalProduct.getNormalizedName().trim().toUpperCase() 
                        : originalRawName.toUpperCase();
                brand = historicalProduct.getBrand() != null ? historicalProduct.getBrand() : "";
                if (historicalProduct.getUnitMeasure() != null && !historicalProduct.getUnitMeasure().isBlank()) {
                    unitMeasure = historicalProduct.getUnitMeasure();
                }
                if (historicalProduct.getCategory() != null) {
                    category = historicalProduct.getCategory().getName();
                }
                log.info("Memória de aprendizado aplicada: '{}' -> '{}'", originalRawName, normalizedName);
            } else {
                var normalized = normalizerService.normalize(originalRawName, unitMeasure);
                normalizedName = (normalized.normalizedName() != null ? normalized.normalizedName() : originalRawName).trim().toUpperCase();
                brand = normalized.brand();
                unitMeasure = normalized.unitMeasure();
            }

            BigDecimal qty = item.quantity() != null ? item.quantity() : BigDecimal.ONE;
            BigDecimal unitPrice = item.unitPrice() != null ? item.unitPrice() : BigDecimal.ZERO;
            BigDecimal totalPrice = item.totalPrice() != null ? item.totalPrice() : qty.multiply(unitPrice);

            curationItems.add(new CurationItemDTO(
                    originalRawName,
                    normalizedName,
                    brand,
                    unitMeasure,
                    qty,
                    unitPrice,
                    totalPrice,
                    category
            ));
        }

        return curationItems;
    }

    @Transactional(readOnly = true)
    public Page<ReceiptCurationResponseDTO> getByStatus(String status, Pageable pageable) {
        return curationRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(this::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public ReceiptCurationResponseDTO getById(Long id) {
        ReceiptCurationEntity entity = curationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota em curadoria não encontrada com ID: " + id));
        return toResponseDTO(entity);
    }

    /**
     * Admin edita ou valida a nota, alterando o status para 'APROVADA'.
     */
    public ReceiptCurationResponseDTO approveReceipt(Long id, ApproveCurationRequestDTO request) {
        ReceiptCurationEntity entity = curationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota em curadoria não encontrada com ID: " + id));

        if (request.marketName() != null && !request.marketName().isBlank()) {
            entity.setMarketName(request.marketName().trim());
        }
        if (request.totalAmount() != null) {
            entity.setTotalAmount(request.totalAmount());
        }
        if (request.items() != null && !request.items().isEmpty()) {
            entity.setItemsPayload(serializeItems(request.items()));
        }

        entity.setStatus("APROVADA");
        ReceiptCurationEntity saved = curationRepository.save(entity);
        log.info("Receipt curation ID {} marked as APROVADA", id);
        notificationService.resolveCurationNotifications(id);
        return toResponseDTO(saved);
    }

    /**
     * Rejeita a nota.
     */
    public void rejectReceipt(Long id) {
        ReceiptCurationEntity entity = curationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Nota em curadoria não encontrada com ID: " + id));
        entity.setStatus("REJEITADA");
        curationRepository.save(entity);
        log.info("Receipt curation ID {} marked as REJEITADA", id);
        notificationService.resolveCurationNotifications(id);
    }

    /**
     * Publica todas as notas com status 'APROVADA' em lote para as tabelas oficiais (mercado, recibo, produtos_master).
     */
    @Caching(evict = {
            @CacheEvict(value = "priceStats", allEntries = true),
            @CacheEvict(value = "topProducts", allEntries = true),
            @CacheEvict(value = "priceTrend", allEntries = true),
            @CacheEvict(value = "marketComparison", allEntries = true),
            @CacheEvict(value = "cheapestProducts", allEntries = true),
            @CacheEvict(value = "mostExpensiveProducts", allEntries = true),
            @CacheEvict(value = "bestShoppingDays", allEntries = true),
            @CacheEvict(value = "purchasePattern", allEntries = true),
            @CacheEvict(value = "products", allEntries = true)
    })
    public int publishApprovedBatch() {
        List<ReceiptCurationEntity> approvedList = curationRepository.findByStatus("APROVADA");
        log.info("Publishing batch of {} approved receipts to official tables", approvedList.size());

        List<Long> approvedIds = approvedList.stream().map(ReceiptCurationEntity::getId).toList();
        int count = 0;
        for (ReceiptCurationEntity item : approvedList) {
            activateReceipt(item);
            item.setStatus("ATIVA");
            curationRepository.save(item);
            if (item.getUser() != null) {
                notificationService.notifyUserReceiptActivated(item.getUser(), item.getMarketName(), item.getId());
            }
            count++;
        }
        notificationService.resolveCurationNotificationsBatch(approvedIds);
        return count;
    }

    private void activateReceipt(ReceiptCurationEntity curation) {
        // 1. Resolve ou cria Mercado
        MarketsEntity market = resolveMarket(curation.getMarketName(), curation.getMarketCnpj());

        // 2. Cria Recibo Oficial
        ReceiptsEntity receipt = new ReceiptsEntity();
        receipt.setMarket(market);
        receipt.setPurchaseDate(curation.getPurchaseDate() != null ? curation.getPurchaseDate() : LocalDateTime.now());
        receipt.setTotalAmount(curation.getTotalAmount());
        receipt.setAccessKey(curation.getAccessKey());
        ReceiptsEntity savedReceipt = receiptsRepository.save(receipt);

        // 3. Desserializa itens aprovados e consolida no products_master e receipt_items
        List<CurationItemDTO> items = deserializeItems(curation.getItemsPayload());
        for (CurationItemDTO itemDTO : items) {
            ProductsMasterEntity product = resolveOrCreateProductMaster(itemDTO);

            ReceiptItemsEntity itemEntity = new ReceiptItemsEntity();
            itemEntity.setReceipt(savedReceipt);
            itemEntity.setProduct(product);
            itemEntity.setOriginalNameOnReceipt(itemDTO.originalName() != null ? itemDTO.originalName() : itemDTO.normalizedName());
            itemEntity.setQuantity(itemDTO.quantity() != null ? itemDTO.quantity() : BigDecimal.ONE);
            itemEntity.setUnitPrice(itemDTO.unitPrice() != null ? itemDTO.unitPrice() : BigDecimal.ZERO);
            itemEntity.setTotalPrice(itemDTO.totalPrice() != null ? itemDTO.totalPrice() : itemEntity.getQuantity().multiply(itemEntity.getUnitPrice()));

            receiptItemsRepository.save(itemEntity);
        }
    }

    private MarketsEntity resolveMarket(String name, String cnpj) {
        String cleanName = (name != null && !name.isBlank()) ? name.trim() : "Supermercado";
        if (cnpj != null && !cnpj.isBlank()) {
            Optional<MarketsEntity> byCnpj = marketsRepository.findByCnpj(cnpj.trim());
            if (byCnpj.isPresent()) return byCnpj.get();
        }

        MarketsEntity newMarket = new MarketsEntity();
        newMarket.setName(cleanName);
        newMarket.setCnpj(cnpj != null ? cnpj.trim() : null);
        return marketsRepository.save(newMarket);
    }

    private ProductsMasterEntity resolveOrCreateProductMaster(CurationItemDTO itemDTO) {
        String normName = itemDTO.normalizedName() != null && !itemDTO.normalizedName().isBlank()
                ? itemDTO.normalizedName().trim().toUpperCase()
                : (itemDTO.originalName() != null ? itemDTO.originalName().trim().toUpperCase() : "PRODUTO");

        return productsMasterRepository.findFirstByNormalizedNameIgnoreCase(normName)
                .orElseGet(() -> {
                    ProductsMasterEntity p = new ProductsMasterEntity();
                    p.setNormalizedName(normName);
                    p.setBrand(itemDTO.brand());
                    p.setUnitMeasure(itemDTO.unitMeasure() != null ? itemDTO.unitMeasure() : "un");

                    if (itemDTO.category() != null && !itemDTO.category().isBlank()) {
                        String cleanCat = itemDTO.category().trim();
                        CategoriesEntity cat = categoriesRepository.findByName(cleanCat)
                                .orElseGet(() -> {
                                    CategoriesEntity c = new CategoriesEntity();
                                    c.setName(cleanCat);
                                    return categoriesRepository.save(c);
                                });
                        p.setCategory(cat);
                    }
                    return productsMasterRepository.save(p);
                });
    }

    private String serializeItems(List<CurationItemDTO> items) {
        try {
            return objectMapper.writeValueAsString(items);
        } catch (Exception e) {
            log.error("Failed to serialize curation items", e);
            return "[]";
        }
    }

    private List<CurationItemDTO> deserializeItems(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<CurationItemDTO>>() {});
        } catch (Exception e) {
            log.error("Failed to deserialize curation items", e);
            return Collections.emptyList();
        }
    }

    public ReceiptCurationResponseDTO toResponseDTO(ReceiptCurationEntity entity) {
        return new ReceiptCurationResponseDTO(
                entity.getId(),
                entity.getSourceUrl(),
                entity.getAccessKey(),
                entity.getMarketName(),
                entity.getMarketCnpj(),
                entity.getPurchaseDate(),
                entity.getTotalAmount(),
                entity.getStatus(),
                deserializeItems(entity.getItemsPayload()),
                entity.getCreatedAt()
        );
    }

    private LocalDateTime parseDate(String rawDate) {
        if (rawDate == null || rawDate.isBlank()) return LocalDateTime.now();
        try {
            return LocalDateTime.parse(rawDate);
        } catch (DateTimeParseException e) {
            try {
                return LocalDate.parse(rawDate).atStartOfDay();
            } catch (Exception ex) {
                return LocalDateTime.now();
            }
        }
    }
}
