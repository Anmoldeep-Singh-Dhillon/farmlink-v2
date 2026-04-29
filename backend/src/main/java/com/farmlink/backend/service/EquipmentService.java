package com.farmlink.backend.service;

import com.farmlink.backend.dto.request.CreateListingRequest;
import com.farmlink.backend.dto.request.RentalRequestDto;
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
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EquipmentService {

    private final EquipmentListingRepository listingRepository;
    private final EquipmentImageRepository imageRepository;
    private final EquipmentRentalRequestRepository rentalRequestRepository;
    private final NotificationRepository notificationRepository;
    private final BookingHistoryRepository historyRepository;
    private final MinioService minioService;
    private final EntityManager entityManager;

    @Value("${geo.default-radius-km}")
    private double defaultRadiusKm;

    @Transactional
    public EquipmentListing createListing(CreateListingRequest req,
                                          List<MultipartFile> images) {
        User owner = SecurityUtils.getCurrentUser();

        if (req.getRentalBasis() != RentalBasis.DAILY && req.getHourlyRate() == null) {
            throw new BadRequestException("Hourly rate is required for HOURLY or BOTH rental basis");
        }
        if (req.getRentalBasis() != RentalBasis.HOURLY && req.getDailyRate() == null) {
            throw new BadRequestException("Daily rate is required for DAILY or BOTH rental basis");
        }

        entityManager.createNativeQuery("""
                INSERT INTO equipment_listings (owner_id, equipment_type, description, rental_basis,
                    hourly_rate, daily_rate, security_deposit, available_from, available_till,
                    status, latitude, longitude, location, created_at, updated_at)
                VALUES (:ownerId, :equipmentType, :description, CAST(:rentalBasis AS rental_basis),
                    :hourlyRate, :dailyRate, :securityDeposit, :availableFrom, :availableTill,
                    CAST('ACTIVE' AS listing_status), :latitude, :longitude,
                    ST_MakePoint(:longitude, :latitude)::geography, NOW(), NOW())
                """)
                .setParameter("ownerId", owner.getId())
                .setParameter("equipmentType", req.getEquipmentType())
                .setParameter("description", req.getDescription())
                .setParameter("rentalBasis", req.getRentalBasis().name())
                .setParameter("hourlyRate", req.getHourlyRate())
                .setParameter("dailyRate", req.getDailyRate())
                .setParameter("securityDeposit", req.getSecurityDeposit())
                .setParameter("availableFrom", req.getAvailableFrom())
                .setParameter("availableTill", req.getAvailableTill())
                .setParameter("latitude", owner.getLatitude())
                .setParameter("longitude", owner.getLongitude())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        EquipmentListing listing = listingRepository.findByOwnerIdOrderByCreatedAtDesc(owner.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Failed to create listing"));

        if (images != null) {
            for (int i = 0; i < images.size(); i++) {
                MultipartFile file = images.get(i);
                if (file != null && !file.isEmpty()) {
                    String objectKey = minioService.uploadFile(
                            file, minioService.getEquipmentBucket(), owner.getId());
                    String imageUrl = minioService.buildPublicUrl(
                            minioService.getEquipmentBucket(), objectKey);
                    EquipmentImage image = EquipmentImage.builder()
                            .listing(listing)
                            .imageUrl(imageUrl)
                            .objectKey(objectKey)
                            .displayOrder((short) i)
                            .build();
                    imageRepository.save(image);
                }
            }
        }

        return listing;
    }

    public Page<EquipmentListing> getNearbyListings(Double lat, Double lng,
                                                     Double radiusKm,
                                                     String equipmentType,
                                                     int page, int size) {
        double radius = (radiusKm != null ? radiusKm : defaultRadiusKm) * 1000;
        Pageable pageable = PageRequest.of(page, size);
        return listingRepository.findNearbyActive(lat, lng, radius, equipmentType, pageable);
    }

    public EquipmentListing getListingById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Listing not found"));
    }

    public List<EquipmentListing> getMyListings() {
        return listingRepository.findByOwnerIdOrderByCreatedAtDesc(
                SecurityUtils.getCurrentUserId());
    }

    @Transactional
    public void deleteListing(Long id) {
        User currentUser = SecurityUtils.getCurrentUser();
        EquipmentListing listing = getListingById(id);

        if (!listing.getOwner().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only delete your own listings");
        }

        List<EquipmentImage> images = imageRepository.findByListingIdOrderByDisplayOrder(id);
        for (EquipmentImage image : images) {
            minioService.deleteFile(minioService.getEquipmentBucket(), image.getObjectKey());
        }

        entityManager.createNativeQuery(
                "UPDATE equipment_listings SET status = CAST('DELETED' AS listing_status) WHERE id = :id")
                .setParameter("id", id)
                .executeUpdate();
    }

    @Transactional
    public EquipmentRentalRequest sendRentalRequest(Long listingId, RentalRequestDto req) {
        User requester = SecurityUtils.getCurrentUser();
        EquipmentListing listing = getListingById(listingId);

        if (listing.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("This listing is not available for rent");
        }
        if (listing.getOwner().getId().equals(requester.getId())) {
            throw new BadRequestException("You cannot request your own listing");
        }

        if (req.getRentalBasis() == RentalBasis.DAILY) {
            if (req.getFromDate() == null || req.getToDate() == null) {
                throw new BadRequestException("From date and to date are required for daily rental");
            }
        } else if (req.getRentalBasis() == RentalBasis.HOURLY) {
            if (req.getNumHours() == null || req.getNumHours() <= 0) {
                throw new BadRequestException("Number of hours is required for hourly rental");
            }
        }

        entityManager.createNativeQuery("""
                INSERT INTO equipment_rental_requests (listing_id, requester_id, rental_basis,
                    from_date, to_date, num_hours, description, status, requested_at)
                VALUES (:listingId, :requesterId, CAST(:rentalBasis AS rental_basis),
                    :fromDate, :toDate, :numHours, :description,
                    CAST('PENDING' AS request_status), NOW())
                """)
                .setParameter("listingId", listing.getId())
                .setParameter("requesterId", requester.getId())
                .setParameter("rentalBasis", req.getRentalBasis().name())
                .setParameter("fromDate", req.getFromDate())
                .setParameter("toDate", req.getToDate())
                .setParameter("numHours", req.getNumHours())
                .setParameter("description", req.getDescription())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        EquipmentRentalRequest rentalRequest = rentalRequestRepository
                .findByRequesterIdOrderByRequestedAtDesc(requester.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Failed to create rental request"));

        notificationRepository.save(Notification.builder()
                .recipient(listing.getOwner())
                .type(NotificationType.RENTAL_REQUEST_RECEIVED)
                .message(requester.getFullName() + " has requested to rent your " +
                        listing.getEquipmentType())
                .referenceId(rentalRequest.getId())
                .build());

        return rentalRequest;
    }

    @Transactional
    public EquipmentRentalRequest acceptRentalRequest(Long requestId) {
        User currentUser = SecurityUtils.getCurrentUser();
        EquipmentRentalRequest request = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getListing().getOwner().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only accept requests on your own listings");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This request is no longer pending");
        }

        entityManager.createNativeQuery(
                "UPDATE equipment_rental_requests SET status = CAST('ACCEPTED' AS request_status), responded_at = NOW() WHERE id = :id")
                .setParameter("id", requestId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        request = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        entityManager.createNativeQuery(
                "UPDATE equipment_listings SET status = CAST('BOOKED' AS listing_status) WHERE id = :id")
                .setParameter("id", request.getListing().getId())
                .executeUpdate();

        rentalRequestRepository.rejectOtherRequests(
                request.getListing().getId(), requestId);

        notificationRepository.save(Notification.builder()
                .recipient(request.getRequester())
                .type(NotificationType.RENTAL_REQUEST_ACCEPTED)
                .message("Your request for " + request.getListing().getEquipmentType() +
                        " has been accepted")
                .referenceId(requestId)
                .build());

        historyRepository.save(BookingHistory.builder()
                .user(currentUser)
                .historyType(HistoryType.EQUIPMENT_RENTED_OUT)
                .equipmentListingId(request.getListing().getId())
                .rentalRequestId(requestId)
                .title(request.getListing().getEquipmentType() + " rented to " +
                        request.getRequester().getFullName())
                .otherPartyName(request.getRequester().getFullName())
                .otherPartyMobile(request.getRequester().getMobile())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .build());

        historyRepository.save(BookingHistory.builder()
                .user(request.getRequester())
                .historyType(HistoryType.EQUIPMENT_RENTED_IN)
                .equipmentListingId(request.getListing().getId())
                .rentalRequestId(requestId)
                .title(request.getListing().getEquipmentType() + " rented from " +
                        currentUser.getFullName())
                .otherPartyName(currentUser.getFullName())
                .otherPartyMobile(currentUser.getMobile())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .build());

        return request;
    }

    @Transactional
    public EquipmentRentalRequest rejectRentalRequest(Long requestId) {
        User currentUser = SecurityUtils.getCurrentUser();
        EquipmentRentalRequest request = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getListing().getOwner().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only reject requests on your own listings");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This request is no longer pending");
        }

        entityManager.createNativeQuery(
                "UPDATE equipment_rental_requests SET status = CAST('REJECTED' AS request_status), responded_at = NOW() WHERE id = :id")
                .setParameter("id", requestId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        request = rentalRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        notificationRepository.save(Notification.builder()
                .recipient(request.getRequester())
                .type(NotificationType.RENTAL_REQUEST_REJECTED)
                .message("Your request for " + request.getListing().getEquipmentType() +
                        " has been rejected")
                .referenceId(requestId)
                .build());

        return request;
    }

    public List<EquipmentRentalRequest> getReceivedRequests() {
        return rentalRequestRepository.findReceivedByOwner(SecurityUtils.getCurrentUserId());
    }

    public List<EquipmentRentalRequest> getSentRequests() {
        return rentalRequestRepository.findByRequesterIdOrderByRequestedAtDesc(
                SecurityUtils.getCurrentUserId());
    }
}