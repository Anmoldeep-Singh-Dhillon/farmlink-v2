package com.farmlink.backend.controller;

import com.farmlink.backend.dto.request.LoginRequest;
import com.farmlink.backend.dto.request.RegisterRequest;
import com.farmlink.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @Valid @RequestBody RegisterRequest req) {

        String token = authService.register(
                req.getFullName(), req.getMobile(), req.getPassword(),
                req.getAadhaarNumber(), req.getAddressLine(), req.getCity(),
                req.getState(), req.getPincode(),
                req.getLatitude(), req.getLongitude());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Registration successful"
        ));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest req) {

        String token = authService.login(req.getMobile(), req.getPassword());

        return ResponseEntity.ok(Map.of(
                "token", token,
                "message", "Login successful"
        ));
    }
}