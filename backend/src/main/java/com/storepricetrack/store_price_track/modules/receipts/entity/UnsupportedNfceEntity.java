package com.storepricetrack.store_price_track.modules.receipts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "unsupported_nfce_queue")
@Getter
@Setter
public class UnsupportedNfceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "url", nullable = false, length = 2048)
    private String url;

    @Column(name = "state_uf", length = 10)
    private String stateUf;

    @Column(name = "status", length = 30, nullable = false)
    private String status = "PENDING_PARSER";

    @Column(name = "notes", length = 1000)
    private String notes;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}

