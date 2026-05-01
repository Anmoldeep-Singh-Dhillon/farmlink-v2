package com.farmlink.backend.service;

import com.farmlink.backend.entity.OperatorProfile;
import com.farmlink.backend.enums.ListingStatus;
import com.farmlink.backend.exception.ResourceNotFoundException;
import com.farmlink.backend.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OperatorServiceTest {

    @Mock
    private OperatorProfileRepository operatorProfileRepository;
    @Mock
    private OperatorHireRequestRepository hireRequestRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private BookingHistoryRepository historyRepository;
    @Mock
    private MinioService minioService;
    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private OperatorService operatorService;

    @Test
    void getProfileById_existingId_returnsProfile() {
        OperatorProfile profile = new OperatorProfile();
        profile.setId(1L);
        profile.setStatus(ListingStatus.ACTIVE);

        when(operatorProfileRepository.findById(1L)).thenReturn(Optional.of(profile));

        OperatorProfile result = operatorService.getProfileById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getProfileById_nonExistingId_throwsException() {
        when(operatorProfileRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> operatorService.getProfileById(99L));
    }

    @Test
    void getProfileById_returnsActiveProfile() {
        OperatorProfile profile = new OperatorProfile();
        profile.setId(2L);
        profile.setStatus(ListingStatus.ACTIVE);

        when(operatorProfileRepository.findById(2L)).thenReturn(Optional.of(profile));

        OperatorProfile result = operatorService.getProfileById(2L);

        assertEquals(ListingStatus.ACTIVE, result.getStatus());
    }
}