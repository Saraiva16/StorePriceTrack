package com.storepricetrack.store_price_track.modules.auth.repository;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
}
