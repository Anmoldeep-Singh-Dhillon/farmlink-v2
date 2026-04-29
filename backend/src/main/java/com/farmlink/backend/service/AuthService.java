package com.farmlink.backend.service;

import com.farmlink.backend.entity.User;
import com.farmlink.backend.exception.BadRequestException;
import com.farmlink.backend.exception.ResourceNotFoundException;
import com.farmlink.backend.repository.UserRepository;
import com.farmlink.backend.security.JwtUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EntityManager entityManager;

    @Transactional
    public String register(String fullName, String mobile, String password,
                           String aadhaarNumber, String addressLine, String city,
                           String state, String pincode,
                           Double latitude, Double longitude) {

        if (userRepository.existsByMobile(mobile)) {
            throw new BadRequestException("Mobile number already registered");
        }
        if (userRepository.existsByAadhaarNumber(aadhaarNumber)) {
            throw new BadRequestException("Aadhaar number already registered");
        }

        String passwordHash = passwordEncoder.encode(password);

        // Insert directly with location set in one shot to satisfy NOT NULL constraint
        entityManager.createNativeQuery("""
                INSERT INTO users (full_name, mobile, password_hash, aadhaar_number,
                    address_line, city, state, pincode, latitude, longitude, location, is_active)
                VALUES (:fullName, :mobile, :passwordHash, :aadhaarNumber,
                    :addressLine, :city, :state, :pincode, :latitude, :longitude,
                    ST_MakePoint(:longitude, :latitude)::geography, true)
                """)
                .setParameter("fullName", fullName)
                .setParameter("mobile", mobile)
                .setParameter("passwordHash", passwordHash)
                .setParameter("aadhaarNumber", aadhaarNumber)
                .setParameter("addressLine", addressLine)
                .setParameter("city", city)
                .setParameter("state", state)
                .setParameter("pincode", pincode)
                .setParameter("latitude", latitude)
                .setParameter("longitude", longitude)
                .executeUpdate();

        User user = userRepository.findByMobile(mobile)
                .orElseThrow(() -> new RuntimeException("User not found after insert"));

        return jwtUtil.generateToken(user.getId(), user.getMobile());
    }

    public String login(String mobile, String password) {
        User user = userRepository.findByMobile(mobile)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getIsActive()) {
            throw new BadRequestException("Account is deactivated");
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BadRequestException("Invalid password");
        }

        return jwtUtil.generateToken(user.getId(), user.getMobile());
    }
}