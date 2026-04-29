package com.farmlink.backend.repository;

import com.farmlink.backend.entity.EquipmentImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipmentImageRepository extends JpaRepository<EquipmentImage, Long> {
    List<EquipmentImage> findByListingIdOrderByDisplayOrder(Long listingId);
    void deleteByListingId(Long listingId);
}