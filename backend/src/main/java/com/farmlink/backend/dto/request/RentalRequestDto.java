package com.farmlink.backend.dto.request;

import com.farmlink.backend.enums.RentalBasis;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;

@Data
public class RentalRequestDto {

    @NotNull(message = "Rental basis is required")
    private RentalBasis rentalBasis;

    private LocalDate fromDate;
    private LocalDate toDate;
    private Short numHours;
    private String description;
}