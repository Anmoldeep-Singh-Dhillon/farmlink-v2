package com.farmlink.backend.repository;

import com.farmlink.backend.entity.JobApplication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    @Query("SELECT a FROM JobApplication a " +
           "JOIN FETCH a.applicant " +
           "WHERE a.jobPost.postedBy.id = :userId " +
           "ORDER BY a.appliedAt DESC")
    List<JobApplication> findReceivedByJobOwner(@Param("userId") Long userId);

    List<JobApplication> findByApplicantIdOrderByAppliedAtDesc(Long applicantId);

    boolean existsByJobPostIdAndApplicantId(Long jobPostId, Long applicantId);

    @Modifying
    @Query("UPDATE JobApplication a SET a.status = 'REJECTED', a.respondedAt = CURRENT_TIMESTAMP " +
       "WHERE a.jobPost.id = :jobPostId AND a.status = 'PENDING' AND a.id <> :acceptedId")
    int rejectOtherApplications(@Param("jobPostId") Long jobPostId, @Param("acceptedId") Long acceptedId);
}