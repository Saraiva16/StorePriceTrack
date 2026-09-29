package com.storepricetrack.store_price_track.config;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("!prod")
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository, org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        seedUser("Isabela", "$2a$10$vfuUZRQnn.wJBr2L2.CZ1u3V8f0RdnS6mDGUyT9O/rkQqdS/c2JJK");
        seedUser("Alcides", "$2a$10$.IzdXr.5wXZEpRnPAnr7Q.kJG0sNl/geBGoRX7aQNjiP9dn5SdZ8m");
        seedUser("Malu", "$2a$10$rlVTnFqznXg0ZEm23CSDXOo90GBXu60SmjCG8dZKLGjJbNCmnMqlW");
        seedUser("Teste", "$2a$10$EAg5FaHueBmvjyFa/lHPSO1YWuv8IpaaSGNwhA3ct4ghTub9O0VPC");
        seedUser("Mateus", "$2a$10$8cwIu2j5HXPqx9TfTr4loO2Xe91qrK.DPu4kjaa.LTRmYqq28c9NG");
        
        // Criar um usuário de teste garantido para o celular
        seedUser("admin", passwordEncoder.encode("admin"));
        
        System.out.println("Users seeded successfully!");
    }

    private void seedUser(String username, String hash) {
        if (userRepository.findByUsername(username).isEmpty()) {
            userRepository.save(User.builder()
                    .username(username)
                    .password(hash)
                    .build());
        }
    }
}
