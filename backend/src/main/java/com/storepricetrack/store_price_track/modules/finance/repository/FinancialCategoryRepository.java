package com.storepricetrack.store_price_track.modules.finance.repository;

import com.storepricetrack.store_price_track.modules.finance.entity.FinancialCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialCategoryRepository extends JpaRepository<FinancialCategory, Long> {
    
    @Query("SELECT c FROM FinancialCategory c WHERE c.user.id IS NULL OR c.user.id = :userId ORDER BY c.name ASC")
    List<FinancialCategory> findAllAvailableForUser(@Param("userId") Long userId);

    Optional<FinancialCategory> findByIdAndUserId(Long id, Long userId);
}

