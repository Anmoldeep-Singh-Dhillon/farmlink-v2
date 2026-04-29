package com.farmlink.backend.dto.request;

import com.farmlink.backend.enums.RentalBasis;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateListingRequest {

    @NotBlank(message = "Equipment type is required")
    private String equipmentType;

    private String description;

    @NotNull(message = "Rental basis is required")
    private RentalBasis rentalBasis;

    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;

    @NotNull(message = "Security deposit is required")
    private BigDecimal securityDeposit;

    @NotNull(message = "Available from date is required")
    private LocalDate availableFrom;

    @NotNull(message = "Available till date is required")
    private LocalDate availableTill;
}