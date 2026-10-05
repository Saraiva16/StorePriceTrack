package com.storepricetrack.store_price_track.modules.shopping_list.repository;

import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ShoppingListItemRepository extends JpaRepository<ShoppingListItemEntity, Long> {
}
