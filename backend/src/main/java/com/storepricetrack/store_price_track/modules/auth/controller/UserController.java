package com.storepricetrack.store_price_track.modules.auth.controller;

import com.storepricetrack.store_price_track.modules.auth.dto.UpdateUserRequest;
import com.storepricetrack.store_price_track.modules.auth.dto.UserResponse;
import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getCurrentUserProfile(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getUserProfile(currentUser.getId()));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateCurrentUserProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody com.storepricetrack.store_price_track.modules.auth.dto.UpdateProfileRequest request) {
        try {
            UserResponse response = userService.updateProfile(currentUser.getId(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changeCurrentUserPassword(
            @AuthenticationPrincipal User currentUser,
            @RequestBody com.storepricetrack.store_price_track.modules.auth.dto.ChangePasswordRequest request) {
        try {
            userService.changePassword(currentUser.getId(), request);
            return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso!"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/pix")
    public ResponseEntity<Map<String, String>> getCurrentUserPix(
            @AuthenticationPrincipal User currentUser) {
        String pixKey = userService.getUserPixKey(currentUser.getId());
        return ResponseEntity.ok(Map.of("pixKey", pixKey != null ? pixKey : ""));
    }

    @PutMapping("/pix")
    public ResponseEntity<Map<String, String>> updateCurrentUserPix(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> payload) {
        String pixKey = payload.get("pixKey");
        String updated = userService.updateUserPixKey(currentUser.getId(), pixKey);
        return ResponseEntity.ok(Map.of(
                "message", "Chave Pix atualizada com sucesso",
                "pixKey", updated != null ? updated : ""
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        try {
            UserResponse response = userService.updateUser(id, request.getUsername(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
