package com.farmlink.backend.controller;

import com.farmlink.backend.dto.request.CreateOperatorProfileRequest;
import com.farmlink.backend.dto.request.HireRequestDto;
import com.farmlink.backend.entity.OperatorHireRequest;
import com.farmlink.backend.entity.OperatorProfile;
import com.farmlink.backend.service.OperatorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/operators")
@RequiredArgsConstructor
public class OperatorController {

    private final OperatorService operatorService;

    // ── Create Operator Profile ───────────────────────────────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<OperatorProfile> createProfile(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "profilePicture", required = false) MultipartFile profilePicture)
            throws Exception {

        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        CreateOperatorProfileRequest req = mapper.readValue(dataJson,
                CreateOperatorProfileRequest.class);

        return ResponseEntity.ok(operatorService.createProfile(req, profilePicture));
    }

    // ── Get Nearby Operators ──────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getNearbyOperators(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String service,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                operatorService.getNearbyOperators(lat, lng, radiusKm, service, page, size));
    }

    // ── Get Single Operator Profile ───────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<OperatorProfile> getProfileById(@PathVariable Long id) {
        return ResponseEntity.ok(operatorService.getProfileById(id));
    }

    // ── Get My Profile ────────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<OperatorProfile> getMyProfile() {
        return ResponseEntity.ok(operatorService.getMyProfile());
    }

    // ── Send Hire Request ─────────────────────────────────────
    @PostMapping("/{id}/hire")
    public ResponseEntity<OperatorHireRequest> sendHireRequest(
            @PathVariable Long id,
            @Valid @RequestBody HireRequestDto req) {

        return ResponseEntity.ok(operatorService.sendHireRequest(id, req));
    }

    // ── Accept Hire Request ───────────────────────────────────
    @PatchMapping("/requests/{requestId}/accept")
    public ResponseEntity<OperatorHireRequest> acceptHireRequest(
            @PathVariable Long requestId) {

        return ResponseEntity.ok(operatorService.acceptHireRequest(requestId));
    }

    // ── Reject Hire Request ───────────────────────────────────
    @PatchMapping("/requests/{requestId}/reject")
    public ResponseEntity<OperatorHireRequest> rejectHireRequest(
            @PathVariable Long requestId) {

        return ResponseEntity.ok(operatorService.rejectHireRequest(requestId));
    }

    // ── Get Received Hire Requests ────────────────────────────
    @GetMapping("/requests/received")
    public ResponseEntity<List<OperatorHireRequest>> getReceivedHireRequests() {
        return ResponseEntity.ok(operatorService.getReceivedHireRequests());
    }

    // ── Get Sent Hire Requests ────────────────────────────────
    @GetMapping("/requests/sent")
    public ResponseEntity<List<OperatorHireRequest>> getSentHireRequests() {
        return ResponseEntity.ok(operatorService.getSentHireRequests());
    }

    @DeleteMapping("/my")
    public ResponseEntity<Map<String, String>> deleteMyProfile() {
    operatorService.deleteProfile();
    return ResponseEntity.ok(Map.of("message", "Operator profile deleted"));
    }
}