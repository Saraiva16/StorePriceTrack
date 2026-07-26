package com.storepricetrack.store_price_track.modules.receipts.entity;

import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "receipts")
@Getter
@Setter
public class ReceiptsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "market_id", referencedColumnName = "id")
    private MarketsEntity market;

    @Column(name = "purchase_date", nullable = false)
    private LocalDateTime purchaseDate;

    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "image_url", length = 512)
    private String imageUrl;

    @Column(name = "access_key", columnDefinition = "CHAR(44)", unique = true)
    private String accessKey;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
