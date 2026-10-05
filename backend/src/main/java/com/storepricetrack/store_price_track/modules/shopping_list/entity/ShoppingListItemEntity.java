package com.storepricetrack.store_price_track.modules.shopping_list.entity;

import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "shopping_list_items")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingListItemEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shopping_list_id", nullable = false)
    private ShoppingListEntity shoppingList;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_master_id", nullable = false)
    private ProductsMasterEntity product;

    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantity;
}
