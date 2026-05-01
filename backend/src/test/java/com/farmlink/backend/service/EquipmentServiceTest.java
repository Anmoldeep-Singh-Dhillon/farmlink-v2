package com.farmlink.backend.service;

import com.farmlink.backend.entity.EquipmentListing;
import com.farmlink.backend.entity.User;
import com.farmlink.backend.enums.ListingStatus;
import com.farmlink.backend.exception.ResourceNotFoundException;
import com.farmlink.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EquipmentServiceTest {

    @Mock
    private EquipmentListingRepository listingRepository;
    @Mock
    private EquipmentImageRepository imageRepository;
    @Mock
    private EquipmentRentalRequestRepository rentalRequestRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private BookingHistoryRepository historyRepository;
    @Mock
    private MinioService minioService;

    @InjectMocks
    private EquipmentService equipmentService;

    @Test
    void getListingById_existingId_returnsListing() {
        EquipmentListing listing = new EquipmentListing();
        listing.setId(1L);
        when(listingRepository.findById(1L)).thenReturn(Optional.of(listing));

        EquipmentListing result = equipmentService.getListingById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getListingById_nonExistingId_throwsException() {
        when(listingRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> equipmentService.getListingById(99L));
    }

    @Test
    void getListingById_returnsCorrectListing() {
        EquipmentListing listing = new EquipmentListing();
        listing.setId(5L);
        listing.setEquipmentType("Tractor");
        listing.setStatus(ListingStatus.ACTIVE);

        when(listingRepository.findById(5L)).thenReturn(Optional.of(listing));

        EquipmentListing result = equipmentService.getListingById(5L);

        assertEquals("Tractor", result.getEquipmentType());
        assertEquals(ListingStatus.ACTIVE, result.getStatus());
    }
}