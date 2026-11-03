package com.storepricetrack.store_price_track.modules.finance.repository;

import com.storepricetrack.store_price_track.modules.finance.entity.FinancialTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface FinancialTransactionRepository extends JpaRepository<FinancialTransaction, Long> {

    List<FinancialTransaction> findByUserIdAndInvoiceDateBetweenOrderByTransactionDateDesc(
            Long userId, LocalDate startDate, LocalDate endDate
    );

    Optional<FinancialTransaction> findByIdAndUserId(Long id, Long userId);

    List<FinancialTransaction> findByInstallmentGroupIdAndUserIdOrderByInstallmentNumberAsc(
            String installmentGroupId, Long userId
    );

    @Modifying
    @Query("DELETE FROM FinancialTransaction t WHERE t.installmentGroupId = :groupId AND t.user.id = :userId")
    void deleteByInstallmentGroupIdAndUserId(@Param("groupId") String groupId, @Param("userId") Long userId);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM FinancialTransaction t WHERE t.creditCard.id = :cardId AND t.user.id = :userId")
    BigDecimal sumAmountByCreditCardIdAndUserId(@Param("cardId") Long cardId, @Param("userId") Long userId);
}

