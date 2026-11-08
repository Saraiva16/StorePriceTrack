package com.storepricetrack.store_price_track.modules.notifications.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.notifications.dto.NotificationResponseDTO;
import com.storepricetrack.store_price_track.modules.notifications.dto.PushSubscriptionDTO;
import com.storepricetrack.store_price_track.modules.notifications.entity.NotificationEntity;
import com.storepricetrack.store_price_track.modules.notifications.entity.PushSubscriptionEntity;
import com.storepricetrack.store_price_track.modules.notifications.repository.NotificationRepository;
import com.storepricetrack.store_price_track.modules.notifications.repository.PushSubscriptionRepository;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptCurationEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final UserRepository userRepository;
    private final WebPushService webPushService;
    private final ObjectMapper objectMapper;

    /**
     * Disparado quando uma nova nota fiscal é enviada para curadoria.
     * Gera notificação in-app persistida e envia Web Push para os dispositivos do admin.
     */
    @Async
    @Transactional
    public void notifyAdminsOfNewReceipt(ReceiptCurationEntity curation) {
        try {
            String market = curation.getMarketName() != null && !curation.getMarketName().isBlank()
                    ? curation.getMarketName()
                    : "Supermercado";
            String amountStr = curation.getTotalAmount() != null
                    ? String.format("R$ %.2f", curation.getTotalAmount()).replace('.', ',')
                    : "R$ 0,00";

            String title = "Nova Nota Fiscal Recebida";
            String message = String.format("Nova nota de %s (%s) aguardando curadoria e conferência.", market, amountStr);
            String type = "RECEIPT_CURATION_PENDING";
            Long refId = curation.getId();

            // Busca os administradores do sistema
            List<User> admins = userRepository.findByUsernameIgnoreCase("admin")
                    .map(List::of)
                    .orElseGet(() -> userRepository.findAll().stream()
                            .filter(u -> "admin".equalsIgnoreCase(u.getUsername()))
                            .toList());

            if (admins.isEmpty()) {
                // Caso ainda não haja usuário com username 'admin', grava notificação de broadcast
                NotificationEntity notification = NotificationEntity.builder()
                        .user(null)
                        .title(title)
                        .message(message)
                        .type(type)
                        .referenceId(refId)
                        .read(false)
                        .build();
                notificationRepository.save(notification);
                log.info("Saved broadcast notification for new receipt curation: {}", refId);
                return;
            }

            for (User admin : admins) {
                // 1. Grava notificação In-App no banco
                NotificationEntity notification = NotificationEntity.builder()
                        .user(admin)
                        .title(title)
                        .message(message)
                        .type(type)
                        .referenceId(refId)
                        .read(false)
                        .build();
                notificationRepository.save(notification);

                // 2. Envia Web Push para todos os dispositivos inscritos do admin
                sendPushToUser(admin, title, message, "/admin/curation", type, refId);
            }
        } catch (Exception e) {
            log.error("Failed to notify admins of new receipt curation ID {}", curation.getId(), e);
        }
    }

    /**
     * Marca automaticamente como resolvidas/lidas as notificações de pendência de curadoria
     * quando a nota é aprovada ou rejeitada pelo administrador.
     */
    @Transactional
    public void resolveCurationNotifications(Long curationId) {
        if (curationId == null) return;
        try {
            int updated = notificationRepository.markAsReadByTypeAndReferenceId("RECEIPT_CURATION_PENDING", curationId);
            log.info("Resolved and marked {} pending curation notification(s) as read for receipt ID {}", updated, curationId);
        } catch (Exception e) {
            log.warn("Failed to resolve curation notifications for ID {}: {}", curationId, e.getMessage());
        }
    }

    /**
     * Marca como resolvidas/lidas as notificações em lote quando as notas são publicadas no sistema.
     */
    @Transactional
    public void resolveCurationNotificationsBatch(List<Long> curationIds) {
        if (curationIds == null || curationIds.isEmpty()) return;
        try {
            int updated = notificationRepository.markAsReadByTypeAndReferenceIds("RECEIPT_CURATION_PENDING", curationIds);
            log.info("Resolved and marked {} pending curation notification(s) as read in batch for {} receipts", updated, curationIds.size());
        } catch (Exception e) {
            log.warn("Failed to resolve curation notifications in batch: {}", e.getMessage());
        }
    }

    /**
     * Notifica o usuário remetente de que sua nota foi validada e ativada no sistema.
     */
    @Async
    @Transactional
    public void notifyUserReceiptActivated(User user, String marketName, Long receiptId) {
        if (user == null) return;
        try {
            String mkt = (marketName != null && !marketName.isBlank()) ? marketName : "Supermercado";
            String title = "Nota Fiscal Confirmada";
            String msg = String.format("Sua compra no %s foi validada e consolidada com sucesso no seu histórico!", mkt);
            String type = "RECEIPT_ACTIVATED";

            NotificationEntity notif = NotificationEntity.builder()
                    .user(user)
                    .title(title)
                    .message(msg)
                    .type(type)
                    .referenceId(receiptId)
                    .read(false)
                    .build();
            notificationRepository.save(notif);

            sendPushToUser(user, title, msg, "/home", type, receiptId);
        } catch (Exception e) {
            log.warn("Failed to notify user {} of receipt activation: {}", user.getUsername(), e.getMessage());
        }
    }

    /**
     * Envia Web Push para os navegadores/dispositivos registrados do usuário.
     */
    public void sendPushToUser(User user, String title, String body, String url, String type, Long refId) {
        List<PushSubscriptionEntity> subscriptions = pushSubscriptionRepository.findByUserId(user.getId());
        if (subscriptions.isEmpty()) {
            log.debug("No active push subscriptions for user: {}", user.getUsername());
            return;
        }

        Map<String, Object> payloadMap = new HashMap<>();
        payloadMap.put("title", title);
        payloadMap.put("body", body);
        payloadMap.put("url", url);
        payloadMap.put("type", type);
        payloadMap.put("referenceId", refId);

        String payloadJson;
        try {
            payloadJson = objectMapper.writeValueAsString(payloadMap);
        } catch (Exception e) {
            payloadJson = String.format("{\"title\":\"%s\",\"body\":\"%s\",\"url\":\"%s\"}", title, body, url);
        }

        for (PushSubscriptionEntity sub : subscriptions) {
            boolean active = webPushService.sendPushNotification(
                    sub.getEndpoint(),
                    sub.getP256dh(),
                    sub.getAuth(),
                    payloadJson
            );

            if (!active) {
                log.info("Removing inactive push subscription ID: {}", sub.getId());
                pushSubscriptionRepository.delete(sub);
            }
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponseDTO> getUserNotifications(User user, Pageable pageable) {
        return notificationRepository.findByUserIdOrBroadcastOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponseDTO);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(User user) {
        return notificationRepository.countUnreadByUserId(user.getId());
    }

    @Transactional
    public void markAsRead(Long notificationId, User user) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUser() == null || n.getUser().getId().equals(user.getId())) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllAsReadByUserId(user.getId());
    }

    @Transactional
    public void savePushSubscription(User user, PushSubscriptionDTO dto) {
        if (dto == null || dto.endpoint() == null || dto.keys() == null) {
            throw new IllegalArgumentException("Dados de inscrição Web Push inválidos.");
        }

        Optional<PushSubscriptionEntity> existing = pushSubscriptionRepository.findByEndpoint(dto.endpoint());
        if (existing.isPresent()) {
            PushSubscriptionEntity sub = existing.get();
            sub.setUser(user);
            sub.setP256dh(dto.keys().p256dh());
            sub.setAuth(dto.keys().auth());
            pushSubscriptionRepository.save(sub);
            log.info("Updated existing push subscription for user: {}", user.getUsername());
        } else {
            PushSubscriptionEntity sub = PushSubscriptionEntity.builder()
                    .user(user)
                    .endpoint(dto.endpoint())
                    .p256dh(dto.keys().p256dh())
                    .auth(dto.keys().auth())
                    .build();
            pushSubscriptionRepository.save(sub);
            log.info("Saved new push subscription for user: {}", user.getUsername());
        }
    }

    private NotificationResponseDTO toResponseDTO(NotificationEntity entity) {
        return new NotificationResponseDTO(
                entity.getId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getType(),
                entity.getReferenceId(),
                entity.isRead(),
                entity.getCreatedAt()
        );
    }
}
