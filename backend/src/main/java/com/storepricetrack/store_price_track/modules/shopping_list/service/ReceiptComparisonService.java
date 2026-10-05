package com.storepricetrack.store_price_track.modules.shopping_list.service;

import com.storepricetrack.store_price_track.modules.estimate.dto.EstimateRequestDTO;
import com.storepricetrack.store_price_track.modules.estimate.service.EstimateService;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import com.storepricetrack.store_price_track.modules.receipt_items.repository.ReceiptItemsRepository;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptsEntity;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptsRepository;
import com.storepricetrack.store_price_track.modules.shopping_list.dto.ReceiptComparisonReportDTO;
import com.storepricetrack.store_price_track.modules.shopping_list.dto.ReceiptComparisonReportDTO.ReceiptItemComparisonDTO;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListEntity;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListItemEntity;
import com.storepricetrack.store_price_track.modules.shopping_list.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReceiptComparisonService {

    private final ShoppingListRepository shoppingListRepository;
    private final ReceiptsRepository receiptsRepository;
    private final ReceiptItemsRepository receiptItemsRepository;
    private final EstimateService estimateService;
    private final ShoppingListService shoppingListService;

    @Transactional
    public ReceiptComparisonReportDTO compareReceiptWithList(Long shoppingListId, Long receiptId) {
        ShoppingListEntity shoppingList = shoppingListRepository.findById(shoppingListId)
                .orElseThrow(() -> new IllegalArgumentException("Shopping list not found"));
        
        ReceiptsEntity receipt = receiptsRepository.findById(receiptId)
                .orElseThrow(() -> new IllegalArgumentException("Receipt not found"));

        List<ReceiptItemsEntity> receiptItems = receiptItemsRepository.findByReceiptId(receiptId);
        
        // 1. Get current estimate for shopping list items
        EstimateRequestDTO estimateReq = new EstimateRequestDTO();
        estimateReq.setMarketName(receipt.getMarket() != null ? receipt.getMarket().getName() : null);
        List<String> productNames = shoppingList.getItems().stream()
                .map(item -> item.getProduct().getNormalizedName())
                .collect(Collectors.toList());
        estimateReq.setProducts(productNames);
        
        Map<String, BigDecimal> estimatedPricesMap = estimateService.calculateEstimate(estimateReq);

        List<ReceiptItemComparisonDTO> comparisonItems = new ArrayList<>();
        BigDecimal estimatedTotal = BigDecimal.ZERO;
        BigDecimal realTotal = BigDecimal.ZERO;

        // Create a map to quickly find receipt items by product ID
        Map<Long, List<ReceiptItemsEntity>> receiptItemsByProduct = receiptItems.stream()
                .filter(ri -> ri.getProduct() != null)
                .collect(Collectors.groupingBy(ri -> ri.getProduct().getId()));

        // Compare items that were in the shopping list
        for (ShoppingListItemEntity listItem : shoppingList.getItems()) {
            Long productId = listItem.getProduct().getId();
            String pName = listItem.getProduct().getNormalizedName();
            
            BigDecimal estQty = listItem.getQuantity();
            BigDecimal estUnitPrice = estimatedPricesMap.getOrDefault(pName, BigDecimal.ZERO);
            BigDecimal estTotalPrice = estUnitPrice.multiply(estQty);

            ReceiptItemComparisonDTO.ReceiptItemComparisonDTOBuilder dtoBuilder = ReceiptItemComparisonDTO.builder()
                    .productName(pName)
                    .estimatedQuantity(estQty)
                    .estimatedUnitPrice(estUnitPrice)
                    .estimatedTotalPrice(estTotalPrice)
                    .foundInList(true);

            List<ReceiptItemsEntity> matchingReceiptItems = receiptItemsByProduct.getOrDefault(productId, new ArrayList<>());
            
            if (!matchingReceiptItems.isEmpty()) {
                // Found in receipt!
                BigDecimal realQty = matchingReceiptItems.stream().map(ReceiptItemsEntity::getQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal realTotPrice = matchingReceiptItems.stream().map(ReceiptItemsEntity::getTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
                BigDecimal realUnitP = realQty.compareTo(BigDecimal.ZERO) > 0 ? 
                        realTotPrice.divide(realQty, 2, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;

                dtoBuilder.foundInReceipt(true)
                        .realQuantity(realQty)
                        .realUnitPrice(realUnitP)
                        .realTotalPrice(realTotPrice)
                        .difference(realTotPrice.subtract(estTotalPrice));
                
                realTotal = realTotal.add(realTotPrice);
                // remove from map so we can process items that are ONLY in the receipt
                receiptItemsByProduct.remove(productId);
            } else {
                dtoBuilder.foundInReceipt(false)
                        .realQuantity(BigDecimal.ZERO)
                        .realUnitPrice(BigDecimal.ZERO)
                        .realTotalPrice(BigDecimal.ZERO)
                        .difference(BigDecimal.ZERO.subtract(estTotalPrice)); // Savings
            }

            estimatedTotal = estimatedTotal.add(estTotalPrice);
            comparisonItems.add(dtoBuilder.build());
        }

        // Process items that are in the receipt but NOT in the shopping list
        for (List<ReceiptItemsEntity> riList : receiptItemsByProduct.values()) {
            for(ReceiptItemsEntity ri : riList) {
                String pName = ri.getProduct() != null ? ri.getProduct().getNormalizedName() : ri.getOriginalNameOnReceipt();
                
                ReceiptItemComparisonDTO dto = ReceiptItemComparisonDTO.builder()
                        .productName(pName)
                        .estimatedQuantity(BigDecimal.ZERO)
                        .estimatedUnitPrice(BigDecimal.ZERO)
                        .estimatedTotalPrice(BigDecimal.ZERO)
                        .foundInList(false)
                        .foundInReceipt(true)
                        .realQuantity(ri.getQuantity())
                        .realUnitPrice(ri.getUnitPrice())
                        .realTotalPrice(ri.getTotalPrice())
                        .difference(ri.getTotalPrice()) // Extra expense
                        .build();

                realTotal = realTotal.add(ri.getTotalPrice());
                comparisonItems.add(dto);
            }
        }
        
        // Items without product match in DB but present in receipt
        List<ReceiptItemsEntity> unmatchedItems = receiptItems.stream().filter(ri -> ri.getProduct() == null).collect(Collectors.toList());
        for(ReceiptItemsEntity ri : unmatchedItems) {
             ReceiptItemComparisonDTO dto = ReceiptItemComparisonDTO.builder()
                        .productName(ri.getOriginalNameOnReceipt())
                        .estimatedQuantity(BigDecimal.ZERO)
                        .estimatedUnitPrice(BigDecimal.ZERO)
                        .estimatedTotalPrice(BigDecimal.ZERO)
                        .foundInList(false)
                        .foundInReceipt(true)
                        .realQuantity(ri.getQuantity())
                        .realUnitPrice(ri.getUnitPrice())
                        .realTotalPrice(ri.getTotalPrice())
                        .difference(ri.getTotalPrice())
                        .build();
                realTotal = realTotal.add(ri.getTotalPrice());
                comparisonItems.add(dto);
        }

        shoppingListService.completeCart(shoppingListId);

        return ReceiptComparisonReportDTO.builder()
                .estimatedTotal(estimatedTotal)
                .realTotal(realTotal)
                .difference(realTotal.subtract(estimatedTotal))
                .items(comparisonItems)
                .build();
    }
}
