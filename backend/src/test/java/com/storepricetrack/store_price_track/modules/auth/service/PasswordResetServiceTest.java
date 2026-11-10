package com.storepricetrack.store_price_track.modules.auth.service;

import com.storepricetrack.store_price_track.modules.auth.entity.PasswordResetToken;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.PasswordResetTokenRepository;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.auth.validation.PasswordValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PasswordResetServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private EmailService emailService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private PasswordResetService passwordResetService;

    private User sampleUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(passwordResetService, "frontendUrl", "https://localhost:5173");

        sampleUser = User.builder()
                .id(1L)
                .username("matheus")
                .email("matheus@example.com")
                .password("encoded_old_pass")
                .build();
    }

    @Test
    @DisplayName("processForgotPassword com usuário existente deve invalidar tokens antigos, criar novo e enviar e-mail")
    void processForgotPassword_ExistingUser_Success() {
        when(userRepository.findByEmailIgnoreCase("matheus@example.com")).thenReturn(Optional.of(sampleUser));

        passwordResetService.processForgotPassword("matheus@example.com");

        verify(tokenRepository).invalidateAllActiveByUser(sampleUser);
        verify(tokenRepository).save(any(PasswordResetToken.class));
        verify(emailService).sendPasswordResetEmail(eq("matheus@example.com"), eq("matheus"), contains("https://localhost:5173/reset-password?token="));
    }

    @Test
    @DisplayName("processForgotPassword com usuário inexistente deve responder silenciosamente (anti-enumeração)")
    void processForgotPassword_NonExistingUser_SilentReturn() {
        when(userRepository.findByEmailIgnoreCase("desconhecido@example.com")).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> passwordResetService.processForgotPassword("desconhecido@example.com"));

        verify(tokenRepository, never()).invalidateAllActiveByUser(any());
        verify(tokenRepository, never()).save(any());
        verify(emailService, never()).sendPasswordResetEmail(any(), any(), any());
    }

    @Test
    @DisplayName("validateResetToken deve retornar true quando token existir e for válido")
    void validateResetToken_Valid_ReturnsTrue() {
        String rawToken = "testtoken123456";
        String hash = PasswordResetService.hashToken(rawToken);

        PasswordResetToken validToken = PasswordResetToken.builder()
                .user(sampleUser)
                .tokenHash(hash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(validToken));

        boolean result = passwordResetService.validateResetToken(rawToken);
        assertTrue(result);
    }

    @Test
    @DisplayName("validateResetToken deve retornar false quando token estiver expirado")
    void validateResetToken_Expired_ReturnsFalse() {
        String rawToken = "expiredtoken";
        String hash = PasswordResetService.hashToken(rawToken);

        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .user(sampleUser)
                .tokenHash(hash)
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(expiredToken));

        boolean result = passwordResetService.validateResetToken(rawToken);
        assertFalse(result);
    }

    @Test
    @DisplayName("validateResetToken deve retornar false quando token já tiver sido utilizado")
    void validateResetToken_AlreadyUsed_ReturnsFalse() {
        String rawToken = "usedtoken";
        String hash = PasswordResetService.hashToken(rawToken);

        PasswordResetToken usedToken = PasswordResetToken.builder()
                .user(sampleUser)
                .tokenHash(hash)
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .used(true)
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(usedToken));

        boolean result = passwordResetService.validateResetToken(rawToken);
        assertFalse(result);
    }

    @Test
    @DisplayName("resetPassword deve atualizar senha com sucesso quando senha for forte e token válido")
    void resetPassword_ValidTokenAndStrongPassword_Success() {
        String rawToken = "mytoken";
        String hash = PasswordResetService.hashToken(rawToken);
        String strongPassword = "StrongPassword@2026";

        PasswordResetToken token = PasswordResetToken.builder()
                .user(sampleUser)
                .tokenHash(hash)
                .expiresAt(LocalDateTime.now().plusMinutes(15))
                .used(false)
                .build();

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.of(token));
        when(passwordEncoder.encode(strongPassword)).thenReturn("encoded_new_password");

        passwordResetService.resetPassword(rawToken, strongPassword, passwordEncoder);

        assertEquals("encoded_new_password", sampleUser.getPassword());
        assertTrue(token.isUsed());
        verify(userRepository).save(sampleUser);
        verify(tokenRepository).save(token);
        verify(tokenRepository).invalidateAllActiveByUser(sampleUser);
    }

    @Test
    @DisplayName("resetPassword deve lançar exceção quando a senha for fraca")
    void resetPassword_WeakPassword_ThrowsException() {
        String rawToken = "mytoken";
        String weakPassword = "123";

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> passwordResetService.resetPassword(rawToken, weakPassword, passwordEncoder)
        );

        assertEquals(PasswordValidator.STRONG_PASSWORD_MESSAGE, ex.getMessage());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword deve lançar exceção quando token for inválido ou inexistente")
    void resetPassword_InvalidToken_ThrowsException() {
        String rawToken = "nonexistent";
        String hash = PasswordResetService.hashToken(rawToken);
        String strongPassword = "StrongPassword@2026";

        when(tokenRepository.findByTokenHash(hash)).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> passwordResetService.resetPassword(rawToken, strongPassword, passwordEncoder)
        );

        verify(userRepository, never()).save(any());
    }
}
