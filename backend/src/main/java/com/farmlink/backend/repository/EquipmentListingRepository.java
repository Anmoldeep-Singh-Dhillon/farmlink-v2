package com.farmlink.backend.repository;

import com.farmlink.backend.entity.EquipmentListing;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EquipmentListingRepository extends JpaRepository<EquipmentListing, Long> {

    @Query(value = """
        SELECT * FROM equipment_listings
        WHERE status = 'ACTIVE'
          AND available_till >= CURRENT_DATE
          AND (:equipmentType IS NULL OR LOWER(equipment_type) LIKE LOWER(CONCAT('%', :equipmentType, '%')))
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radiusMetres)
        ORDER BY ST_Distance(location, ST_MakePoint(:lng, :lat)::geography)
        """,
        countQuery = """
        SELECT COUNT(*) FROM equipment_listings
        WHERE status = 'ACTIVE'
          AND available_till >= CURRENT_DATE
          AND (:equipmentType IS NULL OR LOWER(equipment_type) LIKE LOWER(CONCAT('%', :equipmentType, '%')))
          AND ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, :radiusMetres)
        """,
        nativeQuery = true)
    Page<EquipmentListing> findNearbyActive(
            @Param("lat") double lat,
            @Param("lng") double lng,
            @Param("radiusMetres") double radiusMetres,
            @Param("equipmentType") String equipmentType,
            Pageable pageable);

    List<EquipmentListing> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    @Modifying
    @Query("UPDATE EquipmentListing e SET e.status = 'EXPIRED' " +
           "WHERE e.status = 'ACTIVE' AND e.availableTill < CURRENT_DATE")
    int expireOldListings();
}