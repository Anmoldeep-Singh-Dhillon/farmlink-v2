package com.farmlink.backend.repository;

import com.farmlink.backend.entity.EquipmentRentalRequest;
import com.farmlink.backend.enums.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface EquipmentRentalRequestRepository extends JpaRepository<EquipmentRentalRequest, Long> {

    @Query("SELECT r FROM EquipmentRentalRequest r " +
           "JOIN FETCH r.requester " +
           "WHERE r.listing.owner.id = :ownerId " +
           "ORDER BY r.requestedAt DESC")
    List<EquipmentRentalRequest> findReceivedByOwner(@Param("ownerId") Long ownerId);

    List<EquipmentRentalRequest> findByRequesterIdOrderByRequestedAtDesc(Long requesterId);

    @Modifying
    @Query("UPDATE EquipmentRentalRequest r SET r.status = 'REJECTED', r.respondedAt = CURRENT_TIMESTAMP " +
       "WHERE r.listing.id = :listingId AND r.status = 'PENDING' AND r.id <> :acceptedId")
    int rejectOtherRequests(@Param("listingId") Long listingId, @Param("acceptedId") Long acceptedId);

    List<EquipmentRentalRequest> findByListingIdAndStatus(Long listingId, RequestStatus status);
}