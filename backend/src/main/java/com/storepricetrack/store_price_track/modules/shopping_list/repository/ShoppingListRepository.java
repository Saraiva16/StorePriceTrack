package com.storepricetrack.store_price_track.modules.shopping_list.repository;

import com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ShoppingListRepository extends JpaRepository<ShoppingListEntity, Long> {
    Optional<ShoppingListEntity> findFirstByUserIdAndStatusOrderByCreatedAtDesc(Long userId, com.storepricetrack.store_price_track.modules.shopping_list.entity.ShoppingListStatus status);
}
