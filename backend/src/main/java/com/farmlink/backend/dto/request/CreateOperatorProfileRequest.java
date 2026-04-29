package com.farmlink.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateOperatorProfileRequest {

    @NotNull(message = "Services offered is required")
    @Size(min = 1, message = "At least one service must be selected")
    private String[] servicesOffered;

    private BigDecimal hourlyRate;
    private BigDecimal dailyRate;

    @NotNull(message = "Please specify if rate is negotiable")
    private Boolean isRateNegotiable;

    private String bio;
}