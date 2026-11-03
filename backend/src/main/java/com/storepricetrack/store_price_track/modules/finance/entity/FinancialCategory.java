package com.storepricetrack.store_price_track.modules.finance.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "financial_categories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TransactionType type;

    @Column(length = 50)
    private String icon;

    @Column(length = 20)
    private String color;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

