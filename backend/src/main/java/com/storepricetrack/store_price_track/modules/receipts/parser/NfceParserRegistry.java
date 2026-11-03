package com.storepricetrack.store_price_track.modules.receipts.parser;

import org.springframework.stereotype.Component;

import java.net.URI;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class NfceParserRegistry {

    private final List<INfceParser> parsers;
    private static final Pattern UF_IN_DOMAIN_PATTERN = Pattern.compile("(?i)\\.([a-z]{2})\\.gov\\.br");

    public NfceParserRegistry(List<INfceParser> parsers) {
        this.parsers = parsers;
    }

    public Optional<INfceParser> findParser(String url) {
        if (url == null || url.isBlank()) {
            return Optional.empty();
        }
        return parsers.stream()
                .filter(parser -> parser.supports(url))
                .findFirst();
    }

    public String detectUf(String url) {
        if (url == null || url.isBlank()) {
            return "UNKNOWN";
        }
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (host != null) {
                Matcher m = UF_IN_DOMAIN_PATTERN.matcher(host);
                if (m.find()) {
                    return m.group(1).toUpperCase();
                }
            }
        } catch (Exception ignored) {
        }
        return "UNKNOWN";
    }
}

