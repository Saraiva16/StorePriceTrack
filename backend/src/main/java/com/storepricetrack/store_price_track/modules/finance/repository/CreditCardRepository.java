package com.storepricetrack.store_price_track.modules.finance.repository;

import com.storepricetrack.store_price_track.modules.finance.entity.CreditCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CreditCardRepository extends JpaRepository<CreditCard, Long> {
    List<CreditCard> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<CreditCard> findByIdAndUserId(Long id, Long userId);
}

