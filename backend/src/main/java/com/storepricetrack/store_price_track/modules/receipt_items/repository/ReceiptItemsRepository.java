package com.storepricetrack.store_price_track.modules.receipt_items.repository;

import com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO;
import com.storepricetrack.store_price_track.modules.receipt_items.entity.ReceiptItemsEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptItemsRepository extends JpaRepository<ReceiptItemsEntity, Long> {

    List<ReceiptItemsEntity> findByReceiptId(Long receiptId);

    List<ReceiptItemsEntity> findByProductId(Long productId);

    Page<ReceiptItemsEntity> findByProductId(Long productId, Pageable pageable);

    List<ReceiptItemsEntity> findByProductIsNotNull();

    Optional<ReceiptItemsEntity> findFirstByOriginalNameOnReceiptIgnoreCaseAndProductIsNotNull(String originalNameOnReceipt);

    @Query("SELECT MIN(ri.unitPrice) FROM ReceiptItemsEntity ri WHERE ri.product.id = :productId")
    Optional<BigDecimal> findMinUnitPriceByProductId(@Param("productId") Long productId);

    @Query("SELECT MAX(ri.unitPrice) FROM ReceiptItemsEntity ri WHERE ri.product.id = :productId")
    Optional<BigDecimal> findMaxUnitPriceByProductId(@Param("productId") Long productId);

    @Query("SELECT AVG(ri.unitPrice) FROM ReceiptItemsEntity ri WHERE ri.product.id = :productId")
    Optional<Double> findAverageUnitPriceByProductId(@Param("productId") Long productId);

    @Query("""
            SELECT new com.storepricetrack.store_price_track.modules.receipt_items.dto.TopProductDTO(
                p.id, p.normalizedName, SUM(ri.quantity), COUNT(ri))
            FROM ReceiptItemsEntity ri
            JOIN ri.product p
            GROUP BY p.id, p.normalizedName
            ORDER BY SUM(ri.quantity) DESC
            """)
    List<TopProductDTO> findTopProducts(Pageable pageable);

    @Query("SELECT ri.unitPrice FROM ReceiptItemsEntity ri " +
           "WHERE ri.product.normalizedName = :productName " +
           "AND ri.receipt.market.name = :marketName")
    List<BigDecimal> findPricesByProductAndMarket(
            @Param("productName") String productName,
            @Param("marketName") String marketName);

    @Query("SELECT ri.unitPrice FROM ReceiptItemsEntity ri " +
           "WHERE ri.product.normalizedName = :productName")
    List<BigDecimal> findPricesByProduct(@Param("productName") String productName);
}
