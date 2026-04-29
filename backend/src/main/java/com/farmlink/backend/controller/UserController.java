package com.farmlink.backend.controller;

import com.farmlink.backend.dto.request.UpdateProfileRequest;
import com.farmlink.backend.entity.User;
import com.farmlink.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<User> getMyProfile() {
        return ResponseEntity.ok(userService.getMyProfile());
    }

    @PatchMapping("/me")
    public ResponseEntity<User> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest req) {
        return ResponseEntity.ok(userService.updateMyProfile(
                req.getFullName(), req.getAddressLine(),
                req.getCity(), req.getState(), req.getPincode(),
                req.getLatitude(), req.getLongitude()));
    }
}