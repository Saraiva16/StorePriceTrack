package com.storepricetrack.store_price_track.modules.notifications.repository;

import com.storepricetrack.store_price_track.modules.notifications.entity.NotificationEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    @Query("SELECT n FROM NotificationEntity n WHERE n.user.id = :userId OR n.user IS NULL ORDER BY n.createdAt DESC")
    Page<NotificationEntity> findByUserIdOrBroadcastOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT COUNT(n) FROM NotificationEntity n WHERE (n.user.id = :userId OR n.user IS NULL) AND n.read = false")
    long countUnreadByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.read = true WHERE (n.user.id = :userId OR n.user IS NULL) AND n.read = false")
    int markAllAsReadByUserId(@Param("userId") Long userId);
}
