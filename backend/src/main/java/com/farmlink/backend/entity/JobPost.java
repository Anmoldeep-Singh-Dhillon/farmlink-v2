package com.farmlink.backend.entity;

import com.farmlink.backend.enums.ListingStatus;
import com.farmlink.backend.enums.RentalBasis;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "job_posts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobPost {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "aadhaarNumber"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "posted_by", nullable = false)
    private User postedBy;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "service_needed", nullable = false, length = 100)
    private String serviceNeeded;

    @Column(name = "desired_rate", precision = 10, scale = 2)
    private BigDecimal desiredRate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "rate_basis")
    private RentalBasis rateBasis;

    @Column(name = "work_from_date", nullable = false)
    private LocalDate workFromDate;

    @Column(name = "work_to_date", nullable = false)
    private LocalDate workToDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "listing_status")
    @Builder.Default
    private ListingStatus status = ListingStatus.ACTIVE;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}