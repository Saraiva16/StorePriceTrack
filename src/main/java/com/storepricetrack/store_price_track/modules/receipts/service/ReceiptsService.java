package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.dto.ReceiptItemDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReceiptsService implements IReceiptsService {

    private static final Logger log = LoggerFactory.getLogger(ReceiptsService.class);

    private final ReceiptsRepository receiptsRepository;
    private final ReceiptItemsRepository receiptItemsRepository;

    @Override
    public List<ReceiptResponseDTO> findByMarket(Long marketId) {
        log.debug("Fetching receipts for market {}", marketId);
        return receiptsRepository.findByMarketId(marketId).stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public List<ReceiptResponseDTO> findByPeriod(LocalDateTime start, LocalDateTime end) {
        log.debug("Fetching receipts between {} and {}", start, end);
        return receiptsRepository.findByPurchaseDateBetween(start, end).stream()
                .map(this::toResponseDTO)
                .toList();
    }

    @Override
    public ReceiptResponseDTO getById(Long id) {
        log.debug("Fetching receipt by id {}", id);
        return receiptsRepository.findById(id)
                .map(this::toResponseDTO)
                .orElseThrow(() -> new EntityNotFoundException("Receipt not found with id: " + id));
    }

    @Override
    public List<ReceiptResponseDTO> getRecent(int months) {
        LocalDateTime end = LocalDateTime.now();
        LocalDateTime start = end.minusMonths(months);
        return findByPeriod(start, end);
    }

    private ReceiptResponseDTO toResponseDTO(ReceiptsEntity receipt) {
        List<ReceiptItemDTO> items = receiptItemsRepository.findByReceiptId(receipt.getId()).stream()
                .map(i -> new ReceiptItemDTO(i.getOriginalNameOnReceipt(), i.getQuantity(), i.getUnitPrice(), i.getTotalPrice(),
                        i.getProduct() != null ? i.getProduct().getId() : null))
                .toList();
        MarketsEntity market = receipt.getMarket();
        return new ReceiptResponseDTO(
                market.getName(), market.getCnpj(), receipt.getPurchaseDate(), receipt.getTotalAmount(), receipt.getAccessKey(), items);
    }
}
