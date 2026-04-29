package com.farmlink.backend.controller;

import com.farmlink.backend.dto.request.CreateJobPostRequest;
import com.farmlink.backend.dto.request.JobApplicationDto;
import com.farmlink.backend.entity.JobApplication;
import com.farmlink.backend.entity.JobPost;
import com.farmlink.backend.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // ── Create Job Post ───────────────────────────────────────
    @PostMapping
    public ResponseEntity<JobPost> createJobPost(
            @Valid @RequestBody CreateJobPostRequest req) {
        return ResponseEntity.ok(jobService.createJobPost(req));
    }

    // ── Get Nearby Jobs ───────────────────────────────────────
    @GetMapping
    public ResponseEntity<?> getNearbyJobs(
            @RequestParam Double lat,
            @RequestParam Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false) String service,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return ResponseEntity.ok(
                jobService.getNearbyJobs(lat, lng, radiusKm, service, page, size));
    }

    // ── Get Single Job Post ───────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<JobPost> getJobPostById(@PathVariable Long id) {
        return ResponseEntity.ok(jobService.getJobPostById(id));
    }

    // ── Get My Job Posts ──────────────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<JobPost>> getMyJobPosts() {
        return ResponseEntity.ok(jobService.getMyJobPosts());
    }

    // ── Apply for Job ─────────────────────────────────────────
    @PostMapping("/{id}/apply")
    public ResponseEntity<JobApplication> applyForJob(
            @PathVariable Long id,
            @Valid @RequestBody JobApplicationDto req) {
        return ResponseEntity.ok(jobService.applyForJob(id, req));
    }

    // ── Accept Application ────────────────────────────────────
    @PatchMapping("/applications/{applicationId}/accept")
    public ResponseEntity<JobApplication> acceptApplication(
            @PathVariable Long applicationId) {
        return ResponseEntity.ok(jobService.acceptApplication(applicationId));
    }

    // ── Reject Application ────────────────────────────────────
    @PatchMapping("/applications/{applicationId}/reject")
    public ResponseEntity<JobApplication> rejectApplication(
            @PathVariable Long applicationId) {
        return ResponseEntity.ok(jobService.rejectApplication(applicationId));
    }

    // ── Get Received Applications ─────────────────────────────
    @GetMapping("/applications/received")
    public ResponseEntity<List<JobApplication>> getReceivedApplications() {
        return ResponseEntity.ok(jobService.getReceivedApplications());
    }

    // ── Get Sent Applications ─────────────────────────────────
    @GetMapping("/applications/sent")
    public ResponseEntity<List<JobApplication>> getSentApplications() {
        return ResponseEntity.ok(jobService.getSentApplications());
    }
}