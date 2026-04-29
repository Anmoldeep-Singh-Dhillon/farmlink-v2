package com.farmlink.backend.dto.request;

import com.farmlink.backend.enums.RentalBasis;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CreateJobPostRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Description is required")
    private String description;

    @NotBlank(message = "Service needed is required")
    private String serviceNeeded;

    private BigDecimal desiredRate;
    private RentalBasis rateBasis;

    @NotNull(message = "Work from date is required")
    private LocalDate workFromDate;

    @NotNull(message = "Work to date is required")
    private LocalDate workToDate;
}