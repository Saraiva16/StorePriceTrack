package com.storepricetrack.store_price_track.modules.notifications.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public record PushSubscriptionDTO(
        String endpoint,
        KeysDTO keys
) {
    public record KeysDTO(
            String p256dh,
            String auth
    ) {
    }
}
