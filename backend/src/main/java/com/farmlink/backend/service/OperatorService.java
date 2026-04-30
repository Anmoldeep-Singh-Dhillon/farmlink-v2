package com.farmlink.backend.service;

import com.farmlink.backend.dto.request.CreateOperatorProfileRequest;
import com.farmlink.backend.dto.request.HireRequestDto;
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
import java.util.Arrays;
import java.util.List;
import com.farmlink.backend.enums.ListingStatus;

@Service
@RequiredArgsConstructor
public class OperatorService {

    private final OperatorProfileRepository operatorProfileRepository;
    private final OperatorHireRequestRepository hireRequestRepository;
    private final NotificationRepository notificationRepository;
    private final BookingHistoryRepository historyRepository;
    private final MinioService minioService;
    private final EntityManager entityManager;

    @Value("${geo.default-radius-km}")
    private double defaultRadiusKm;

    @Transactional
    public OperatorProfile createProfile(CreateOperatorProfileRequest req,
                                         MultipartFile profilePicture) {
        User currentUser = SecurityUtils.getCurrentUser();

       if (operatorProfileRepository.findByUserIdAndStatusNot(
        currentUser.getId(), ListingStatus.DELETED).isPresent()) {
    throw new BadRequestException("You already have an operator profile");
}

        String profilePictureUrl = null;
        String profilePictureKey = null;
        if (profilePicture != null && !profilePicture.isEmpty()) {
            profilePictureKey = minioService.uploadFile(
                    profilePicture, minioService.getOperatorsBucket(), currentUser.getId());
            profilePictureUrl = minioService.buildPublicUrl(
                    minioService.getOperatorsBucket(), profilePictureKey);
        }

        String servicesArray = "{" + String.join(",",
                Arrays.stream(req.getServicesOffered())
                        .map(s -> "\"" + s + "\"")
                        .toArray(String[]::new)) + "}";

        entityManager.createNativeQuery("""
                INSERT INTO operator_profiles (user_id, services_offered, profile_picture_url,
                    profile_picture_key, hourly_rate, daily_rate, is_rate_negotiable, bio,
                    status, latitude, longitude, location, created_at, updated_at)
                VALUES (:userId, CAST(:services AS text[]), :profilePictureUrl,
                    :profilePictureKey, :hourlyRate, :dailyRate, :isRateNegotiable, :bio,
                    CAST('ACTIVE' AS listing_status), :latitude, :longitude,
                    ST_MakePoint(:longitude, :latitude)::geography, NOW(), NOW())
                """)
                .setParameter("userId", currentUser.getId())
                .setParameter("services", servicesArray)
                .setParameter("profilePictureUrl", profilePictureUrl)
                .setParameter("profilePictureKey", profilePictureKey)
                .setParameter("hourlyRate", req.getHourlyRate())
                .setParameter("dailyRate", req.getDailyRate())
                .setParameter("isRateNegotiable", req.getIsRateNegotiable())
                .setParameter("bio", req.getBio())
                .setParameter("latitude", currentUser.getLatitude())
                .setParameter("longitude", currentUser.getLongitude())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        return operatorProfileRepository.findByUserId(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Failed to create operator profile"));
    }

    public Page<OperatorProfile> getNearbyOperators(Double lat, Double lng,
                                                     Double radiusKm,
                                                     String service,
                                                     int page, int size) {
        double radius = (radiusKm != null ? radiusKm : defaultRadiusKm) * 1000;
        Pageable pageable = PageRequest.of(page, size);
        return operatorProfileRepository.findNearbyActive(lat, lng, radius, service, pageable);
    }

public OperatorProfile getProfileById(Long id) {
    return operatorProfileRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Operator profile not found"));
}

public OperatorProfile getMyProfile() {
    return operatorProfileRepository.findByUserIdAndStatusNot(
            SecurityUtils.getCurrentUserId(), ListingStatus.DELETED)
            .orElseThrow(() -> new ResourceNotFoundException("You don't have an operator profile"));
}
    @Transactional
    public OperatorHireRequest sendHireRequest(Long operatorId, HireRequestDto req) {
        User requester = SecurityUtils.getCurrentUser();
        OperatorProfile operator = getProfileById(operatorId);

        if (operator.getUser().getId().equals(requester.getId())) {
            throw new BadRequestException("You cannot hire yourself");
        }
        if (operator.getStatus() != ListingStatus.ACTIVE) {
            throw new BadRequestException("This operator is not available");
        }
        if (req.getToDate().isBefore(req.getFromDate())) {
            throw new BadRequestException("To date must be after from date");
        }

        entityManager.createNativeQuery("""
                INSERT INTO operator_hire_requests (operator_id, requester_id, from_date, to_date,
                    offered_rate, rate_basis, description, status, requested_at)
                VALUES (:operatorId, :requesterId, :fromDate, :toDate,
                    :offeredRate, CAST(:rateBasis AS rental_basis), :description,
                    CAST('PENDING' AS request_status), NOW())
                """)
                .setParameter("operatorId", operator.getId())
                .setParameter("requesterId", requester.getId())
                .setParameter("fromDate", req.getFromDate())
                .setParameter("toDate", req.getToDate())
                .setParameter("offeredRate", req.getOfferedRate())
                .setParameter("rateBasis", req.getRateBasis().name())
                .setParameter("description", req.getDescription())
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        OperatorHireRequest hireRequest = hireRequestRepository
                .findByRequesterIdOrderByRequestedAtDesc(requester.getId())
                .stream().findFirst()
                .orElseThrow(() -> new RuntimeException("Failed to create hire request"));

        notificationRepository.save(Notification.builder()
                .recipient(operator.getUser())
                .type(NotificationType.HIRE_REQUEST_RECEIVED)
                .message(requester.getFullName() + " wants to hire you from " +
                        req.getFromDate() + " to " + req.getToDate())
                .referenceId(hireRequest.getId())
                .build());

        return hireRequest;
    }

    @Transactional
    public OperatorHireRequest acceptHireRequest(Long requestId) {
        User currentUser = SecurityUtils.getCurrentUser();
        OperatorHireRequest request = hireRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Hire request not found"));

        if (!request.getOperator().getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only accept requests for your own profile");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This request is no longer pending");
        }

        entityManager.createNativeQuery(
                "UPDATE operator_hire_requests SET status = CAST('ACCEPTED' AS request_status), responded_at = NOW() WHERE id = :id")
                .setParameter("id", requestId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        request = hireRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Hire request not found"));

        entityManager.createNativeQuery(
                "UPDATE operator_profiles SET status = CAST('BOOKED' AS listing_status) WHERE id = :id")
                .setParameter("id", request.getOperator().getId())
                .executeUpdate();

        hireRequestRepository.rejectOtherRequests(
                request.getOperator().getId(), requestId);

        notificationRepository.save(Notification.builder()
                .recipient(request.getRequester())
                .type(NotificationType.HIRE_REQUEST_ACCEPTED)
                .message("Your hire request has been accepted by " + currentUser.getFullName())
                .referenceId(requestId)
                .build());

        historyRepository.save(BookingHistory.builder()
                .user(currentUser)
                .historyType(HistoryType.OPERATOR_HIRED_OUT)
                .operatorProfileId(request.getOperator().getId())
                .hireRequestId(requestId)
                .title("Hired by " + request.getRequester().getFullName())
                .otherPartyName(request.getRequester().getFullName())
                .otherPartyMobile(request.getRequester().getMobile())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .amount(request.getOfferedRate())
                .build());

        historyRepository.save(BookingHistory.builder()
                .user(request.getRequester())
                .historyType(HistoryType.OPERATOR_HIRED_IN)
                .operatorProfileId(request.getOperator().getId())
                .hireRequestId(requestId)
                .title("Hired " + currentUser.getFullName())
                .otherPartyName(currentUser.getFullName())
                .otherPartyMobile(currentUser.getMobile())
                .fromDate(request.getFromDate())
                .toDate(request.getToDate())
                .amount(request.getOfferedRate())
                .build());

        return request;
    }

    @Transactional
    public OperatorHireRequest rejectHireRequest(Long requestId) {
        User currentUser = SecurityUtils.getCurrentUser();
        OperatorHireRequest request = hireRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Hire request not found"));

        if (!request.getOperator().getUser().getId().equals(currentUser.getId())) {
            throw new UnauthorizedException("You can only reject requests for your own profile");
        }
        if (request.getStatus() != RequestStatus.PENDING) {
            throw new BadRequestException("This request is no longer pending");
        }

        entityManager.createNativeQuery(
                "UPDATE operator_hire_requests SET status = CAST('REJECTED' AS request_status), responded_at = NOW() WHERE id = :id")
                .setParameter("id", requestId)
                .executeUpdate();

        entityManager.flush();
        entityManager.clear();

        request = hireRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Hire request not found"));

        notificationRepository.save(Notification.builder()
                .recipient(request.getRequester())
                .type(NotificationType.HIRE_REQUEST_REJECTED)
                .message("Your hire request has been rejected by " + currentUser.getFullName())
                .referenceId(requestId)
                .build());

        return request;
    }

    public List<OperatorHireRequest> getReceivedHireRequests() {
        return hireRequestRepository.findReceivedByOperatorUserId(
                SecurityUtils.getCurrentUserId());
    }

    public List<OperatorHireRequest> getSentHireRequests() {
        return hireRequestRepository.findByRequesterIdOrderByRequestedAtDesc(
                SecurityUtils.getCurrentUserId());
    }
    @Transactional
    public void deleteProfile() {
        User currentUser = SecurityUtils.getCurrentUser();
        OperatorProfile profile = operatorProfileRepository.findByUserId(currentUser.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Operator profile not found"));

        entityManager.createNativeQuery(
            "UPDATE operator_profiles SET status = CAST('DELETED' AS listing_status) WHERE id = :id")
            .setParameter("id", profile.getId())
            .executeUpdate();
        }
}