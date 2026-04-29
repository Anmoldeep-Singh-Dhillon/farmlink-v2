package com.farmlink.backend.dto.request;

import com.farmlink.backend.enums.RentalBasis;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class JobApplicationDto {

    private BigDecimal offeredRate;
    private RentalBasis rateBasis;
    private String coverNote;
}