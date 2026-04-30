package com.farmlink.backend.repository;

import com.farmlink.backend.entity.OperatorProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import com.farmlink.backend.enums.ListingStatus;


public interface OperatorProfileRepository extends JpaRepository<OperatorProfile, Long> {

@Query("SELECT o FROM OperatorProfile o WHERE o.user.id = :userId AND o.status != 'DELETED' ORDER BY o.createdAt DESC")
Optional<OperatorProfile> findByUserId(@Param("userId") Long userId);
boolean existsByUserId(Long userId);
Optional<OperatorProfile> findByUserIdAndStatusNot(Long userId, ListingStatus status);
    

    @Query(value = """
        SELECT * FROM operator_profiles
        WHERE status = 'ACTIVE'
          AND (:service IS NULL OR :service = ANY(services_offered))
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radiusMetres)
        ORDER BY ST_Distance(location, ST_MakePoint(:lng, :lat)::geography)
        """,
        countQuery = """
        SELECT COUNT(*) FROM operator_profiles
        WHERE status = 'ACTIVE'
          AND (:service IS NULL OR :service = ANY(services_offered))
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radiusMetres)
        """,
        nativeQuery = true)
    Page<OperatorProfile> findNearbyActive(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMetres") double radiusMetres,
            @Param("service") String service,
            Pageable pageable);
}