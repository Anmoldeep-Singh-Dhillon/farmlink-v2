package com.farmlink.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.OffsetDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "equipment_images")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EquipmentImage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "listing_id", nullable = false)
    private EquipmentListing listing;
    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl;

    @Column(name = "object_key", nullable = false, length = 300)
    private String objectKey;

    @Column(name = "display_order", nullable = false)
    @Builder.Default
    private Short displayOrder = 0;

    @CreationTimestamp
    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private OffsetDateTime uploadedAt;
}