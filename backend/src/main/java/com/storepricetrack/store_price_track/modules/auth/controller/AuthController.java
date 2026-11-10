package com.storepricetrack.store_price_track.modules.auth.controller;

import com.storepricetrack.store_price_track.modules.auth.dto.AuthRequest;
import com.storepricetrack.store_price_track.modules.auth.dto.AuthResponse;
import com.storepricetrack.store_price_track.modules.auth.dto.RegisterRequest;
import com.storepricetrack.store_price_track.modules.auth.dto.UserResponse;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.service.AuthService;
import com.storepricetrack.store_price_track.modules.auth.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Value("${auth.cookie.secure:false}")
    private boolean cookieSecure;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request, passwordEncoder);
            return ResponseEntity.ok(AuthResponse.builder().message("Usuário registrado com sucesso.").build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder().message(e.getMessage()).build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @RequestBody AuthRequest request,
            HttpServletResponse response
    ) {
        try {
            User user = authService.authenticateAndGetUser(request.getUsername(), request.getPassword(), passwordEncoder);

            String accessToken = jwtService.generateToken(user);
            String refreshToken = jwtService.generateRefreshToken(user);

            ResponseCookie accessCookie = ResponseCookie.from("jwt", accessToken)
                    .httpOnly(true)
                    .secure(cookieSecure)
                    .path("/")
                    .maxAge(24 * 60 * 60) // 24 hours
                    .sameSite("Strict")
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                    .httpOnly(true)
                    .secure(cookieSecure)
                    .path("/")
                    .maxAge(14 * 24 * 60 * 60) // 14 days
                    .sameSite("Strict")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok(AuthResponse.builder().message("Login realizado com sucesso.").build());
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder().message(e.getMessage()).build());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (var cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder().message("Refresh token não encontrado.").build());
        }

        try {
            String identifier = jwtService.extractUsername(refreshToken);
            User user = authService.getUserByIdentifier(identifier);

            if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(AuthResponse.builder().message("Refresh token inválido ou expirado.").build());
            }

            String newAccessToken = jwtService.generateToken(user);
            String newRefreshToken = jwtService.generateRefreshToken(user);

            ResponseCookie accessCookie = ResponseCookie.from("jwt", newAccessToken)
                    .httpOnly(true)
                    .secure(cookieSecure)
                    .path("/")
                    .maxAge(24 * 60 * 60)
                    .sameSite("Strict")
                    .build();

            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", newRefreshToken)
                    .httpOnly(true)
                    .secure(cookieSecure)
                    .path("/")
                    .maxAge(14 * 24 * 60 * 60)
                    .sameSite("Strict")
                    .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok(AuthResponse.builder().message("Sessão renovada com sucesso.").build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(AuthResponse.builder().message("Falha ao renovar sessão.").build());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<AuthResponse> logout(HttpServletResponse response) {
        ResponseCookie accessCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

        return ResponseEntity.ok(AuthResponse.builder().message("Logged out successfully").build());
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(authService.getMe(authentication.getName()));
    }
}
