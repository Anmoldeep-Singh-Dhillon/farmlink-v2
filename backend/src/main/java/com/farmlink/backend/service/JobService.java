package com.farmlink.backend.service;

import com.farmlink.backend.dto.request.CreateJobPostRequest;
import com.farmlink.backend.dto.request.JobApplicationDto;
import com.farmlink.backend.entity.*;
import com.farmlink.backend.enums.*;
import com.farmlink.backend.exception.*;
import com.farmlink.backend.repository.*;
import com.farmlink.backend.util.SecurityUtils;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobPostRepository jobPostRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final NotificationRepository notificationRepository;
    private final BookingHistoryRepository historyRepository;
    private final EntityManager entityManager;

    @Value("${geo.default-radius-km}")
    private double defaultRadiusKm;

    @Transactional
    public JobPost createJobPost(CreateJobPostRequest req) {
        User currentUser = SecurityUtils.getCurrentUser();

        if (req.getWorkToDate().isBefore(req.getWorkFromDate())) {
            throw new BadRequestException("Work to date must be after work from date");
        }

        String rateBasis = req.getRateBasis() != null ? req.getRateBasis().name() : null;

        entityManager.createNativeQuery("""
                INSERT INTO job_posts (posted_by, title, description, service_needed,
                    desired_rate, rate_basis, work_from_date, work_to_date,
                    status, latitude, longitude, location, created_at, updated_at)
                VALUES (:postedBy, :title, :description, :serviceNeeded,
                    :desiredRate, CAST(:rateBasis AS rental_basis), :workFromDate, :workToDate,
                    CAST('ACTIVE' AS listing_status), :latitude, :longitude,
                    ST_MakePoint(:longitude, :latitude)::geography, NOW(), NOW())
                """)
                .setParameter("postedBy", currentUser.getId())
                .setParameter("title", req.getTitle())
                .setParameter("description", req.getDescription())
                .setParameter("serviceNeeded", req.getServiceNeeded())
                .setParameter("desiredRate", req.getDesiredRate())
                .setParameter("rateBasis", rateBasis)
                .setParameter("workFromDate", req.getWorkFromDate())
                .setParameter("workToDate", req.getWorkToDate())
                .setParameter("latitude", currentUser.getLatitude())
                .setParameter("longitude", currentUser.getLongitude())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        return jobPostRepository.findByPostedByIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Failed to create job post"));
    }

    public Page<JobPost> getNearbyJobs(Double lat, Double lng,
                                        Double radiusKm, String service,
                                        int page, int size) {
        double radius = (radiusKm != null ? radiusKm : defaultRadiusKm) * 1000;
        Pageable pageable = PageRequest.of(page, size);
        return jobPostRepository.findNearbyActive(lat, lng, radius, service, pageable);
    }

    public JobPost getJobPostById(Long id) {
        return jobPostRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job post not found"));
    }

    public List<JobPost> getMyJobPosts() {
        return jobPostRepository.findByPostedByIdOrderByCreatedAtDesc(
                SecurityUtils.getCurrentUserId());
    }

    @Transactional
    public JobApplication applyForJob(Long jobPostId, JobApplicationDto req) {
        User applicant = SecurityUtils.getCurrentUser();
        JobPost jobPost = getJobPostById(jobPostId);

        if (jobPost.getPostedBy().getId().equals(applicant.getId())) {
            throw new BadRequestException("You cannot apply to your own job post");
        }
        if (jobPost.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("This job post is no longer active");
        }
        if (jobApplicationRepository.existsByJobPostIdAndApplicantId(
                jobPostId, applicant.getId())) {
            throw new BadRequestException("You have already applied for this job");
        }

        String rateBasis = req.getRateBasis() != null ? req.getRateBasis().name() : null;

        entityManager.createNativeQuery("""
                INSERT INTO job_applications (job_post_id, applicant_id, offered_rate, rate_basis,
                    cover_note, status, applied_at)
                VALUES (:jobPostId, :applicantId, :offeredRate, CAST(:rateBasis AS rental_basis),
                    :coverNote, CAST('PENDING' AS request_status), NOW())
                """)
                .setParameter("jobPostId", jobPost.getId())
                .setParameter("applicantId", applicant.getId())
                .setParameter("offeredRate", req.getOfferedRate())
                .setParameter("rateBasis", rateBasis)
                .setParameter("coverNote", req.getCoverNote())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        JobApplication application = jobApplicationRepository
                .findByApplicantIdOrderByAppliedAtDesc(applicant.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Failed to create application"));

        notificationRepository.save(Notification.builder()
                .recipient(jobPost.getPostedBy())
                .type(NotificationType.JOB_APPLICATION_RECEIVED)
                .message(applicant.getFullName() + " has applied for your job: " +
                        jobPost.getTitle())
                .referenceId(application.getId())
                .build());

        return application;
    }

    @Transactional
    public JobApplication acceptApplication(Long applicationId) {
        User currentUser = SecurityUtils.getCurrentUser();
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getJobPost().getPostedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only accept applications on your own job posts");
        }
        if (application.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This application is no longer pending");
        }

        entityManager.createNativeQuery(
                "UPDATE job_applications SET status = CAST('ACCEPTED' AS request_status), responded_at = NOW() WHERE id = :id")
                .setParameter("id", applicationId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        entityManager.createNativeQuery(
                "UPDATE job_posts SET status = CAST('BOOKED' AS listing_status) WHERE id = :id")
                .setParameter("id", application.getJobPost().getId())
                .executeUpdate();

        jobApplicationRepository.rejectOtherApplications(
                application.getJobPost().getId(), applicationId);

        notificationRepository.save(Notification.builder()
                .recipient(application.getApplicant())
                .type(NotificationType.JOB_APPLICATION_ACCEPTED)
                .message("Your application for " + application.getJobPost().getTitle() +
                        " has been accepted")
                .referenceId(applicationId)
                .build());

        historyRepository.save(BookingHistory.builder()
                .user(currentUser)
                .historyType(HistoryType.JOB_POSTED_FILLED)
                .jobPostId(application.getJobPost().getId())
                .jobApplicationId(applicationId)
                .title("Job filled: " + application.getJobPost().getTitle())
                .otherPartyName(application.getApplicant().getFullName())
                .otherPartyMobile(application.getApplicant().getMobile())
                .fromDate(application.getJobPost().getWorkFromDate())
                .toDate(application.getJobPost().getWorkToDate())
                .amount(application.getOfferedRate())
                .build());

        historyRepository.save(BookingHistory.builder()
                .user(application.getApplicant())
                .historyType(HistoryType.JOB_APPLICATION_ACCEPTED)
                .jobPostId(application.getJobPost().getId())
                .jobApplicationId(applicationId)
                .title("Got job: " + application.getJobPost().getTitle())
                .otherPartyName(currentUser.getFullName())
                .otherPartyMobile(currentUser.getMobile())
                .fromDate(application.getJobPost().getWorkFromDate())
                .toDate(application.getJobPost().getWorkToDate())
                .amount(application.getOfferedRate())
                .build());

        return application;
    }

    @Transactional
    public JobApplication rejectApplication(Long applicationId) {
        User currentUser = SecurityUtils.getCurrentUser();
        JobApplication application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        if (!application.getJobPost().getPostedBy().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only reject applications on your own job posts");
        }
        if (application.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This application is no longer pending");
        }

        entityManager.createNativeQuery(
                "UPDATE job_applications SET status = CAST('REJECTED' AS request_status), responded_at = NOW() WHERE id = :id")
                .setParameter("id", applicationId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        application = jobApplicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found"));

        notificationRepository.save(Notification.builder()
                .recipient(application.getApplicant())
                .type(NotificationType.JOB_APPLICATION_REJECTED)
                .message("Your application for " + application.getJobPost().getTitle() +
                        " has been rejected")
                .referenceId(applicationId)
                .build());

        return application;
    }

    public List<JobApplication> getReceivedApplications() {
        return jobApplicationRepository.findReceivedByJobOwner(
                SecurityUtils.getCurrentUserId());
    }

    public List<JobApplication> getSentApplications() {
        return jobApplicationRepository.findByApplicantIdOrderByAppliedAtDesc(
                SecurityUtils.getCurrentUserId());
    }
}