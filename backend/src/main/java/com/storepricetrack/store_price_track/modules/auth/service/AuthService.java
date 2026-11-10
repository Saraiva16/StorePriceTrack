package com.storepricetrack.store_price_track.modules.auth.service;

import com.storepricetrack.store_price_track.modules.auth.dto.AuthRequest;
import com.storepricetrack.store_price_track.modules.auth.dto.RegisterRequest;
import com.storepricetrack.store_price_track.modules.auth.dto.UserResponse;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.auth.validation.PasswordValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository repository;
    private final JwtService jwtService;

    public User authenticateAndGetUser(String identifier, String rawPassword, PasswordEncoder passwordEncoder) {
        if (identifier == null || identifier.isBlank()) {
            throw new BadCredentialsException("Informe o usuário ou e-mail.");
        }

        String trimmed = identifier.trim();
        // 1. Tenta buscar por e-mail (chave primária de autenticação)
        User user = repository.findByEmailIgnoreCase(trimmed).orElse(null);

        // 2. Se não encontrou por e-mail, busca por username
        if (user == null) {
            List<User> matchingUsers = repository.findAllByUsernameIgnoreCase(trimmed);
            if (matchingUsers.size() == 1) {
                user = matchingUsers.get(0);
            } else if (matchingUsers.size() > 1) {
                User matched = null;
                for (User u : matchingUsers) {
                    if (passwordEncoder.matches(rawPassword, u.getPassword())) {
                        if (matched != null) {
                            throw new BadCredentialsException("Existe mais de um usuário com este nome. Por favor, acesse utilizando seu e-mail.");
                        }
                        matched = u;
                    }
                }
                user = matched;
            }
        }

        if (user == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new BadCredentialsException("Usuário/e-mail ou senha inválidos.");
        }

        return user;
    }

    public User getUserByIdentifier(String identifier) {
        return repository.findByEmailIgnoreCase(identifier)
                .or(() -> repository.findByUsernameIgnoreCase(identifier))
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + identifier));
    }

    public UserResponse getMe(String identifier) {
        User user = getUserByIdentifier(identifier);
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getNickname())
                .email(user.getEmail())
                .pixKey(user.getPixKey())
                .build();
    }

    public void register(RegisterRequest request, PasswordEncoder passwordEncoder) {
        if (request.getUsername() == null || request.getUsername().trim().isBlank()) {
            throw new IllegalArgumentException("O nome de usuário/apelido é obrigatório.");
        }

        if (request.getEmail() == null || request.getEmail().trim().isBlank()) {
            throw new IllegalArgumentException("O e-mail é obrigatório.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (repository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Este e-mail já está em uso por outro usuário.");
        }

        if (!PasswordValidator.isStrong(request.getPassword())) {
            throw new IllegalArgumentException(PasswordValidator.STRONG_PASSWORD_MESSAGE);
        }

        User newUser = User.builder()
                .username(request.getUsername().trim())
                .email(normalizedEmail)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();
        repository.save(newUser);
    }
}
