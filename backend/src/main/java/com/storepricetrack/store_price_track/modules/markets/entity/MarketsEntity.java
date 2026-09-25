package com.storepricetrack.store_price_track.modules.markets.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "markets")
@Getter
@Setter
public class MarketsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 255, nullable = false)
    private String name;

    @Column(length = 18, unique = true)
    private String cnpj;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 50, name = "city_uf")
    private String cityUf;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
