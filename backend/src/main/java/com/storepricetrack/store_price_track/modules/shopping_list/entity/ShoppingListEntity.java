package com.storepricetrack.store_price_track.modules.shopping_list.entity;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shopping_lists")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShoppingListEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user; 

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ShoppingListStatus status;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "suggested_best_date")
    private LocalDateTime suggestedBestDate;

    @Builder.Default
    @OneToMany(mappedBy = "shoppingList", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShoppingListItemEntity> items = new ArrayList<>();
}
