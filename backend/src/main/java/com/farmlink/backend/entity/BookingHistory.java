package com.farmlink.backend.entity;

import com.farmlink.backend.enums.HistoryType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "booking_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BookingHistory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "aadhaarNumber"})
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "history_type", nullable = false)
    private HistoryType historyType;

    @Column(name = "equipment_listing_id")
    private Long equipmentListingId;

    @Column(name = "rental_request_id")
    private Long rentalRequestId;

    @Column(name = "operator_profile_id")
    private Long operatorProfileId;

    @Column(name = "hire_request_id")
    private Long hireRequestId;

    @Column(name = "job_post_id")
    private Long jobPostId;

    @Column(name = "job_application_id")
    private Long jobApplicationId;

    @Column(name = "title", nullable = false, length = 300)
    private String title;

    @Column(name = "other_party_name", length = 120)
    private String otherPartyName;

    @Column(name = "other_party_mobile", length = 15)
    private String otherPartyMobile;

    @Column(name = "from_date")
    private LocalDate fromDate;

    @Column(name = "to_date")
    private LocalDate toDate;

    @Column(name = "amount", precision = 10, scale = 2)
    private BigDecimal amount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
