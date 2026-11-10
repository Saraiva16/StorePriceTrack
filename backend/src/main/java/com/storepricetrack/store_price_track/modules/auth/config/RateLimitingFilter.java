package com.storepricetrack.store_price_track.modules.auth.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    // Simple in-memory cache for IP addresses
    private final Map<String, Bucket> cache = new ConcurrentHashMap<>();

    private Bucket resolveBucket(String ip) {
        return cache.computeIfAbsent(ip, this::newBucket);
    }

    private Bucket newBucket(String ip) {
        // Em desenvolvimento ou para conexões locais, limite alto para não bloquear testes
        if (isLocalOrDevIp(ip)) {
            Bandwidth devLimit = Bandwidth.classic(500, Refill.intervally(500, Duration.ofMinutes(1)));
            return Bucket.builder().addLimit(devLimit).build();
        }

        // Em produção para IPs externos: 5 requisições a cada 15 minutos
        Bandwidth limit = Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(15)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private boolean isLocalOrDevIp(String ip) {
        if (!"prod".equalsIgnoreCase(activeProfile)) {
            return true;
        }
        if (ip == null) return false;
        return ip.equals("127.0.0.1") || 
               ip.equals("0:0:0:0:0:0:0:1") || 
               ip.startsWith("192.168.") || 
               ip.startsWith("10.") || 
               ip.startsWith("172.");
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Apply rate limiting to login and forgot-password endpoints to prevent brute force / flooding
        if ((request.getRequestURI().equals("/api/auth/login") || request.getRequestURI().equals("/api/auth/forgot-password")) && request.getMethod().equalsIgnoreCase("POST")) {
            String ip = extractClientIp(request);
            Bucket bucket = resolveBucket(ip);

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please try again later.");
                return; // Stop filter chain
            }
        } else {
            filterChain.doFilter(request, response);
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String clientIp = request.getHeader("X-Forwarded-For");
        if (clientIp == null || clientIp.isEmpty() || "unknown".equalsIgnoreCase(clientIp)) {
            clientIp = request.getRemoteAddr();
        }
        if (clientIp != null && clientIp.contains(",")) {
            clientIp = clientIp.split(",")[0].trim();
        }
        return clientIp;
    }
}
