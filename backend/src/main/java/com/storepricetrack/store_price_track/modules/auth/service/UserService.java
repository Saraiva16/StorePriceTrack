package com.storepricetrack.store_price_track.modules.auth.service;

import com.storepricetrack.store_price_track.modules.auth.dto.UserResponse;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> UserResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .pixKey(u.getPixKey())
                        .build())
                .collect(Collectors.toList());
    }

    public UserResponse updateUser(Long id, String newUsername, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (newUsername != null && !newUsername.isBlank()) {
            if (!user.getUsername().equals(newUsername) && userRepository.findByUsername(newUsername).isPresent()) {
                throw new IllegalArgumentException("Username already exists");
            }
            user.setUsername(newUsername);
        }

        if (newPassword != null && !newPassword.isBlank()) {
            user.setPassword(passwordEncoder.encode(newPassword));
        }

        user = userRepository.save(user);

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .pixKey(user.getPixKey())
                .build();
    }

    public String getUserPixKey(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return user.getPixKey();
    }

    public String updateUserPixKey(Long userId, String pixKey) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String trimmed = (pixKey != null && !pixKey.isBlank()) ? pixKey.trim() : null;
        user.setPixKey(trimmed);
        userRepository.save(user);
        return user.getPixKey();
    }

    public UserResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .pixKey(user.getPixKey())
                .build();
    }

    public UserResponse updateProfile(Long userId, com.storepricetrack.store_price_track.modules.auth.dto.UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (request.getUsername() != null && !request.getUsername().isBlank()) {
            String newUsername = request.getUsername().trim();
            if (!user.getUsername().equals(newUsername) && userRepository.findByUsername(newUsername).isPresent()) {
                throw new IllegalArgumentException("Este nome de usuário já está em uso.");
            }
            user.setUsername(newUsername);
        }

        if (request.getPixKey() != null) {
            String trimmedPix = request.getPixKey().trim();
            user.setPixKey(trimmedPix.isEmpty() ? null : trimmedPix);
        }

        user = userRepository.save(user);

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .pixKey(user.getPixKey())
                .build();
    }

    public void changePassword(Long userId, com.storepricetrack.store_price_track.modules.auth.dto.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));

        if (request.getCurrentPassword() == null || request.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("A senha atual é obrigatória.");
        }

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("A senha atual informada está incorreta.");
        }

        if (request.getNewPassword() == null || request.getNewPassword().trim().length() < 6) {
            throw new IllegalArgumentException("A nova senha deve ter no mínimo 6 caracteres.");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new IllegalArgumentException("A nova senha deve ser diferente da senha atual.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword().trim()));
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(id);
    }
}
