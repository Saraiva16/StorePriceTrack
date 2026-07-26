package com.storepricetrack.store_price_track.modules.products_master.entity;

import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "products_master")
@Getter
@Setter
public class ProductsMasterEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", referencedColumnName = "id")
    private CategoriesEntity category;

    @Column(name = "normalized_name", length = 255, nullable = false)
    private String normalizedName;

    @Column(length = 100)
    private String brand;

    @Column(name = "unit_measure", length = 10, columnDefinition = "VARCHAR(10) DEFAULT 'un'")
    private String unitMeasure;

    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

}
