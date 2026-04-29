package com.farmlink.backend.service;

import com.farmlink.backend.entity.User;
import com.farmlink.backend.exception.ResourceNotFoundException;
import com.farmlink.backend.repository.UserRepository;
import com.farmlink.backend.util.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public User getMyProfile() {
        return userRepository.findById(SecurityUtils.getCurrentUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Transactional
    public User updateMyProfile(String fullName, String addressLine,
                                 String city, String state, String pincode,
                                 Double latitude, Double longitude) {
        Long userId = SecurityUtils.getCurrentUserId();

        entityManager.createNativeQuery("""
                UPDATE users SET
                    full_name = :fullName,
                    address_line = :addressLine,
                    city = :city,
                    state = :state,
                    pincode = :pincode,
                    latitude = :latitude,
                    longitude = :longitude,
                    location = ST_MakePoint(:longitude, :latitude)::geography,
                    updated_at = NOW()
                WHERE id = :id
                """)
                .setParameter("fullName", fullName)
                .setParameter("addressLine", addressLine)
                .setParameter("city", city)
                .setParameter("state", state)
                .setParameter("pincode", pincode)
                .setParameter("latitude", latitude)
                .setParameter("longitude", longitude)
                .setParameter("id", userId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}