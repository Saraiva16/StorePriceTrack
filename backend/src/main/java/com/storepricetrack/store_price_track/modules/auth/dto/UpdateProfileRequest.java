package com.storepricetrack.store_price_track.modules.auth.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "O nome de usuário é obrigatório")
    private String username;

    @JsonAlias({"pixKey", "pix_key"})
    private String pixKey;
}
