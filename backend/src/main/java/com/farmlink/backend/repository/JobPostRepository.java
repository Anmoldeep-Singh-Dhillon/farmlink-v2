package com.farmlink.backend.repository;

import com.farmlink.backend.entity.JobPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface JobPostRepository extends JpaRepository<JobPost, Long> {

    @Query(value = """
        SELECT * FROM job_posts
        WHERE status = 'ACTIVE'
          AND work_to_date >= CURRENT_DATE
          AND (:service IS NULL OR LOWER(service_needed) = LOWER(:service))
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radiusMetres)
        ORDER BY ST_Distance(location, ST_MakePoint(:lng, :lat)::geography)
        """,
        countQuery = """
        SELECT COUNT(*) FROM job_posts
        WHERE status = 'ACTIVE'
          AND work_to_date >= CURRENT_DATE
          AND (:service IS NULL OR LOWER(service_needed) = LOWER(:service))
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radiusMetres)
        """,
        nativeQuery = true)
    Page<JobPost> findNearbyActive(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMetres") double radiusMetres,
            @Param("service") String service,
            Pageable pageable);

    List<JobPost> findByPostedByIdOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("UPDATE JobPost j SET j.status = 'EXPIRED' " +
           "WHERE j.status = 'ACTIVE' AND j.workToDate < CURRENT_DATE")
    int expireOldJobs();
}