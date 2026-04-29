package com.farmlink.backend.controller;

import com.farmlink.backend.dto.request.CreateListingRequest;
import com.farmlink.backend.dto.request.RentalRequestDto;
import com.farmlink.backend.entity.EquipmentListing;
import com.farmlink.backend.entity.EquipmentRentalRequest;
import com.farmlink.backend.service.EquipmentService;
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
@RequestMapping("/api/equipment")
@RequiredArgsConstructor
public class EquipmentController {

    private final EquipmentService equipmentService;

    // ── Create Listing (multipart: JSON fields + images) ─────
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EquipmentListing> createListing(
            @RequestPart("data") String dataJson,
            @RequestPart(value = "images", required = false) List<MultipartFile> images)
            throws Exception {

            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            CreateListingRequest req = mapper.readValue(dataJson, CreateListingRequest.class);

        return ResponseEntity.ok(equipmentService.createListing(req, images));
    }

    // ── Get Nearby Listings ───────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getNearbyListings(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String equipmentType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                equipmentService.getNearbyListings(lat, lng, radiusKm, equipmentType, page, size));
    }

    // ── Get Single Listing ────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<EquipmentListing> getListingById(@PathVariable Long id) {
        return ResponseEntity.ok(equipmentService.getListingById(id));
    }

    // ── Get My Listings ───────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<EquipmentListing>> getMyListings() {
        return ResponseEntity.ok(equipmentService.getMyListings());
    }

    // ── Delete Listing ────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteListing(@PathVariable Long id) {
        equipmentService.deleteListing(id);
        return ResponseEntity.ok(Map.of("message", "Listing deleted successfully"));
    }

    // ── Send Rental Request ───────────────────────────────────
    @PostMapping("/{id}/request")
    public ResponseEntity<EquipmentRentalRequest> sendRentalRequest(
            @PathVariable Long id,
            @Valid @RequestBody RentalRequestDto req) {

        return ResponseEntity.ok(equipmentService.sendRentalRequest(id, req));
    }

    // ── Accept Request ────────────────────────────────────────
    @PatchMapping("/requests/{requestId}/accept")
    public ResponseEntity<EquipmentRentalRequest> acceptRequest(
            @PathVariable Long requestId) {

        return ResponseEntity.ok(equipmentService.acceptRentalRequest(requestId));
    }

    // ── Reject Request ────────────────────────────────────────
    @PatchMapping("/requests/{requestId}/reject")
    public ResponseEntity<EquipmentRentalRequest> rejectRequest(
            @PathVariable Long requestId) {

        return ResponseEntity.ok(equipmentService.rejectRentalRequest(requestId));
    }

    // ── Get Received Requests (owner sees incoming) ───────────
    @GetMapping("/requests/received")
    public ResponseEntity<List<EquipmentRentalRequest>> getReceivedRequests() {
        return ResponseEntity.ok(equipmentService.getReceivedRequests());
    }

    // ── Get Sent Requests (farmer sees what they sent) ────────
    @GetMapping("/requests/sent")
    public ResponseEntity<List<EquipmentRentalRequest>> getSentRequests() {
        return ResponseEntity.ok(equipmentService.getSentRequests());
    }
}