package com.farmlink.backend.dto.request;

import com.farmlink.backend.enums.RentalBasis;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class HireRequestDto {

    @NotNull(message = "From date is required")
    private LocalDate fromDate;

    @NotNull(message = "To date is required")
    private LocalDate toDate;

    @NotNull(message = "Offered rate is required")
    private BigDecimal offeredRate;

    @NotNull(message = "Rate basis is required")
    private RentalBasis rateBasis;

    private String description;
}