package com.storepricetrack.store_price_track.modules.notifications.repository;

import com.storepricetrack.store_price_track.modules.notifications.entity.PushSubscriptionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PushSubscriptionRepository extends JpaRepository<PushSubscriptionEntity, Long> {

    List<PushSubscriptionEntity> findByUserId(Long userId);

    Optional<PushSubscriptionEntity> findByEndpoint(String endpoint);

    void deleteByEndpoint(String endpoint);
}
