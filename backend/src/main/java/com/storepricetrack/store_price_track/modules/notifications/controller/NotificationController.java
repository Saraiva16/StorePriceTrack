package com.storepricetrack.store_price_track.modules.notifications.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.notifications.dto.NotificationResponseDTO;
import com.storepricetrack.store_price_track.modules.notifications.dto.PushSubscriptionDTO;
import com.storepricetrack.store_price_track.modules.notifications.dto.VapidPublicKeyDTO;
import com.storepricetrack.store_price_track.modules.notifications.service.NotificationService;
import com.storepricetrack.store_price_track.modules.notifications.service.WebPushService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final WebPushService webPushService;

    @GetMapping
    public ResponseEntity<Page<NotificationResponseDTO>> list(
            @AuthenticationPrincipal User currentUser,
            Pageable pageable) {
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUser, pageable));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal User currentUser) {
        long count = notificationService.getUnreadCount(currentUser);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        notificationService.markAsRead(id, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User currentUser) {
        notificationService.markAllAsRead(currentUser);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<VapidPublicKeyDTO> getVapidPublicKey() {
        return ResponseEntity.ok(new VapidPublicKeyDTO(webPushService.getPublicKey()));
    }

    @PostMapping("/subscribe")
    public ResponseEntity<Map<String, String>> subscribe(
            @AuthenticationPrincipal User currentUser,
            @RequestBody PushSubscriptionDTO subscription) {
        notificationService.savePushSubscription(currentUser, subscription);
        return ResponseEntity.ok(Map.of("message", "Inscrição Web Push salva com sucesso."));
    }

    @PostMapping("/test-push")
    public ResponseEntity<Map<String, String>> testPush(@AuthenticationPrincipal User currentUser) {
        notificationService.sendPushToUser(
                currentUser,
                "Teste de Notificação Push",
                "O Web Push do StorePriceTrack está ativo e apitando com sucesso no seu dispositivo!",
                "/home",
                "TEST_PUSH",
                0L
        );
        return ResponseEntity.ok(Map.of("message", "Notificação de teste enviada."));
    }
}
