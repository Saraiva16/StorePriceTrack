package com.storepricetrack.store_price_track.modules.shopping_list.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListEntity;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListItemEntity;
import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListStatus;
import com.storepricetrack.store_price_track.modules.shopping_list.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final ProductsMasterRepository productsMasterRepository;
    private final BestPurchaseDateCalculator bestPurchaseDateCalculator;

    @Transactional
    public ShoppingListEntity getOrCreateOpenCart(User user) {
        return shoppingListRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), ShoppingListStatus.OPEN)
                .orElseGet(() -> {
                    ShoppingListEntity newList = ShoppingListEntity.builder()
                            .user(user)
                            .status(ShoppingListStatus.OPEN)
                            .build();
                    return shoppingListRepository.save(newList);
                });
    }

    @Transactional
    public ShoppingListEntity addItemToCart(User user, Long productId, BigDecimal quantity) {
        ShoppingListEntity cart = getOrCreateOpenCart(user);
        
        var product = productsMasterRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        // Check if item already in cart, if so update quantity
        var existingItem = cart.getItems().stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .findFirst();

        if (existingItem.isPresent()) {
            existingItem.get().setQuantity(existingItem.get().getQuantity().add(quantity));
        } else {
            ShoppingListItemEntity newItem = ShoppingListItemEntity.builder()
                    .shoppingList(cart)
                    .product(product)
                    .quantity(quantity)
                    .build();
            cart.getItems().add(newItem);
        }

        return shoppingListRepository.save(cart);
    }

    @Transactional
    public ShoppingListEntity closeCart(User user) {
        ShoppingListEntity cart = getOrCreateOpenCart(user);
        if (cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cannot close an empty cart");
        }

        cart.setStatus(ShoppingListStatus.CLOSED);
        cart.setClosedAt(LocalDateTime.now());
        
        LocalDateTime bestDate = bestPurchaseDateCalculator.calculateBestDate(cart);
        cart.setSuggestedBestDate(bestDate);

        return shoppingListRepository.save(cart);
    }

    @Transactional
    public ShoppingListEntity completeCart(Long cartId) {
        ShoppingListEntity cart = shoppingListRepository.findById(cartId)
                .orElseThrow(() -> new IllegalArgumentException("Cart not found"));

        cart.setStatus(ShoppingListStatus.COMPLETED);
        cart.setCompletedAt(LocalDateTime.now());
        return shoppingListRepository.save(cart);
    }
}
