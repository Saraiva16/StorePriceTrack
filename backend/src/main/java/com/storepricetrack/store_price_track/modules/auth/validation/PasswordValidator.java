package com.storepricetrack.store_price_track.modules.auth.validation;

import java.util.regex.Pattern;

public class PasswordValidator {

    // Mínimo 8 caracteres, pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial
    private static final Pattern STRONG_PASSWORD_PATTERN =
            Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_\\-+=.;:,<>~/\\{\\}\\[\\]|]).{8,}$");

    public static boolean isStrong(String password) {
        if (password == null) return false;
        return STRONG_PASSWORD_PATTERN.matcher(password).matches();
    }

    public static final String STRONG_PASSWORD_MESSAGE =
            "A senha deve conter no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma letra minúscula, um número e um caractere especial (@, $, !, %, *, ?, &, etc).";
}
