package com.storepricetrack.store_price_track.modules.notifications.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.notifications.entity.NotificationEntity;
import com.storepricetrack.store_price_track.modules.notifications.repository.NotificationRepository;
import com.storepricetrack.store_price_track.modules.notifications.repository.PushSubscriptionRepository;
import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptCurationEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class NotificationServiceTest {

    private List<NotificationEntity> savedNotifications;
    private NotificationService notificationService;
    private User adminUser;

    @BeforeEach
    void setUp() {
        savedNotifications = new ArrayList<>();
        adminUser = User.builder().id(1L).username("admin").build();

        NotificationRepository notificationRepo = createProxy(NotificationRepository.class, (proxy, method, args) -> {
            if ("save".equals(method.getName())) {
                NotificationEntity entity = (NotificationEntity) args[0];
                savedNotifications.add(entity);
                return entity;
            }
            if ("countUnreadByUserId".equals(method.getName())) {
                return (long) savedNotifications.stream().filter(n -> !n.isRead()).count();
            }
            return null;
        });

        PushSubscriptionRepository pushRepo = createProxy(PushSubscriptionRepository.class, (proxy, method, args) -> {
            if ("findByUserId".equals(method.getName())) {
                return List.of();
            }
            return null;
        });

        UserRepository userRepo = createProxy(UserRepository.class, (proxy, method, args) -> {
            if ("findByUsernameIgnoreCase".equals(method.getName())) {
                return Optional.of(adminUser);
            }
            return Optional.empty();
        });

        WebPushService webPushService = new WebPushService() {
            @Override
            public boolean sendPushNotification(String endpoint, String p256dh, String auth, String payloadJson) {
                return true;
            }
        };

        notificationService = new NotificationService(
                notificationRepo,
                pushRepo,
                userRepo,
                webPushService,
                new ObjectMapper()
        );
    }

    @SuppressWarnings("unchecked")
    private <T> T createProxy(Class<T> interfaceClass, java.lang.reflect.InvocationHandler handler) {
        return (T) Proxy.newProxyInstance(
                interfaceClass.getClassLoader(),
                new Class<?>[]{interfaceClass},
                handler
        );
    }

    @Test
    @DisplayName("Deve registrar notificação in-app para o administrador ao receber nova nota na curadoria")
    void deveNotificarAdminsAoReceberNovaNota() {
        ReceiptCurationEntity curation = ReceiptCurationEntity.builder()
                .id(42L)
                .marketName("WMS Supermercados")
                .totalAmount(new BigDecimal("189.50"))
                .status("EM_ANALISE")
                .build();

        notificationService.notifyAdminsOfNewReceipt(curation);

        assertEquals(1, savedNotifications.size());
        NotificationEntity notification = savedNotifications.get(0);
        assertEquals("Nova Nota Fiscal Recebida", notification.getTitle());
        assertTrue(notification.getMessage().contains("WMS Supermercados"));
        assertTrue(notification.getMessage().contains("189,50"));
        assertEquals("RECEIPT_CURATION_PENDING", notification.getType());
        assertEquals(42L, notification.getReferenceId());
        assertEquals(adminUser, notification.getUser());
        assertFalse(notification.isRead());
    }
}
