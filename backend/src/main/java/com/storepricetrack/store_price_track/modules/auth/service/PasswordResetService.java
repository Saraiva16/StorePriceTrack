package com.storepricetrack.store_price_track.modules.auth.service;

import com.storepricetrack.store_price_track.modules.auth.entity.PasswordResetToken;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.PasswordResetTokenRepository;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.auth.validation.PasswordValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final int EXPIRATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;

    @Value("${app.frontend.url:https://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public void processForgotPassword(String email) {
        if (email == null || email.trim().isBlank()) {
            return;
        }

        String normalizedEmail = email.trim().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOptional.isEmpty()) {
            // Defesa anti-enumeração (OWASP): responde sucesso genérico sem revelar se o e-mail existe
            log.info("Solicitação de recuperação para e-mail não cadastrado ou inexistente: {}", normalizedEmail);
            return;
        }

        User user = userOptional.get();

        // 1. Invalida tokens anteriores não utilizados do usuário
        tokenRepository.invalidateAllActiveByUser(user);

        // 2. Gera novo token criptográfico de uso único
        String rawToken = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(LocalDateTime.now().plusMinutes(EXPIRATION_MINUTES))
                .used(false)
                .build();

        tokenRepository.save(resetToken);

        // 3. Monta URL de recuperação para o frontend
        String normalizedBaseUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String resetUrl = normalizedBaseUrl + "/reset-password?token=" + rawToken;

        // 4. Dispara e-mail (ou loga no console em dev)
        emailService.sendPasswordResetEmail(user.getEmail(), user.getNickname(), resetUrl);
    }

    @Transactional(readOnly = true)
    public boolean validateResetToken(String rawToken) {
        if (rawToken == null || rawToken.trim().isBlank()) {
            return false;
        }

        String tokenHash = hashToken(rawToken.trim());
        return tokenRepository.findByTokenHash(tokenHash)
                .map(PasswordResetToken::isValid)
                .orElse(false);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword, PasswordEncoder passwordEncoder) {
        if (rawToken == null || rawToken.trim().isBlank()) {
            throw new IllegalArgumentException("Token de recuperação ausente ou inválido.");
        }

        if (!PasswordValidator.isStrong(newPassword)) {
            throw new IllegalArgumentException(PasswordValidator.STRONG_PASSWORD_MESSAGE);
        }

        String tokenHash = hashToken(rawToken.trim());
        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new IllegalArgumentException("Link de recuperação inválido ou inexistente."));

        if (!token.isValid()) {
            throw new IllegalArgumentException("O link de recuperação expirou ou já foi utilizado. Solicite um novo link.");
        }

        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        token.setUsed(true);
        tokenRepository.save(token);

        tokenRepository.invalidateAllActiveByUser(user);
        log.info("Senha redefinida com sucesso para o usuário id: {}", user.getId());
    }

    public static String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            return "";
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    hexString.append('0');
                }
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("Algoritmo SHA-256 não disponível", e);
        }
    }
}
