package com.storepricetrack.store_price_track.modules.notifications.service;

import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Security;

@Service
@Slf4j
public class WebPushService {

    @Getter
    @Value("${webpush.vapid.public-key}")
    private String publicKey;

    @Value("${webpush.vapid.private-key}")
    private String privateKey;

    @Value("${webpush.vapid.subject:mailto:admin@storepricetrack.com}")
    private String subject;

    private PushService pushService;

    @PostConstruct
    public void init() {
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
                Security.addProvider(new BouncyCastleProvider());
            }
            this.pushService = new PushService(publicKey, privateKey, subject);
            log.info("WebPushService initialized successfully with VAPID subject: {}", subject);
        } catch (Exception e) {
            log.error("Failed to initialize WebPushService with VAPID keys", e);
        }
    }

    /**
     * Envia mensagem Web Push cifrada para o dispositivo do usuário.
     * Retorna true se entregue com sucesso, ou false caso a inscrição tenha sido revogada/expirada.
     */
    public boolean sendPushNotification(String endpoint, String p256dh, String auth, String payloadJson) {
        if (pushService == null) {
            log.warn("PushService is not initialized. Skipping web push delivery.");
            return false;
        }

        try {
            Notification notification = new Notification(endpoint, p256dh, auth, payloadJson);
            HttpResponse response = pushService.send(notification);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode >= 200 && statusCode < 300) {
                log.info("Web push notification delivered successfully (HTTP {}) to endpoint: {}", statusCode, endpoint);
                return true;
            } else if (statusCode == 404 || statusCode == 410) {
                log.warn("Web push subscription expired or unsubscribed (HTTP {}). Endpoint should be removed: {}", statusCode, endpoint);
                return false;
            } else {
                log.warn("Web push delivery returned unexpected status HTTP {}: {}", statusCode, response.getStatusLine().getReasonPhrase());
                return true;
            }
        } catch (Exception e) {
            log.error("Error sending web push notification to endpoint {}: {}", endpoint, e.getMessage());
            return true;
        }
    }
}
