package com.farmlink.backend.service;

import com.farmlink.backend.repository.EquipmentListingRepository;
import com.farmlink.backend.repository.JobPostRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class SchedulerService {

    private final EquipmentListingRepository equipmentListingRepository;
    private final JobPostRepository jobPostRepository;

    // Runs every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void expireOldListings() {
        int expiredEquipment = equipmentListingRepository.expireOldListings();
        int expiredJobs = jobPostRepository.expireOldJobs();
        log.info("Expired {} equipment listings and {} job posts", expiredEquipment, expiredJobs);
    }
}