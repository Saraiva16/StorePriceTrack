package com.storepricetrack.store_price_track.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequest {

    @NotBlank(message = "Token de recuperação inválido ou ausente.")
    private String token;

    @NotBlank(message = "A nova senha é obrigatória.")
    @JsonAlias({"newPassword", "new_password"})
    private String newPassword;
}
