package com.storepricetrack.store_price_track.modules.shopping_list.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.shopping_list.dto.ReceiptComparisonReportDTO;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListEntity;
import com.storepricetrack.store_price_track.modules.shopping_list.service.ReceiptComparisonService;
import com.storepricetrack.store_price_track.modules.shopping_list.service.ShoppingListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/shopping-list")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService shoppingListService;
    private final ReceiptComparisonService receiptComparisonService;

    @GetMapping("/active")
    public ResponseEntity<ShoppingListEntity> getActiveCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(shoppingListService.getOrCreateOpenCart(user));
    }

    @PostMapping("/add-item")
    public ResponseEntity<ShoppingListEntity> addItemToCart(
            @AuthenticationPrincipal User user,
            @RequestParam Long productId,
            @RequestParam BigDecimal quantity) {
        return ResponseEntity.ok(shoppingListService.addItemToCart(user, productId, quantity));
    }

    @PostMapping("/close")
    public ResponseEntity<ShoppingListEntity> closeCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(shoppingListService.closeCart(user));
    }

    @GetMapping("/{shoppingListId}/compare/{receiptId}")
    public ResponseEntity<ReceiptComparisonReportDTO> compareReceipt(
            @PathVariable Long shoppingListId,
            @PathVariable Long receiptId) {
        return ResponseEntity.ok(receiptComparisonService.compareReceiptWithList(shoppingListId, receiptId));
    }
}
