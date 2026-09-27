package com.storepricetrack.store_price_track.modules.estimate.dto;

import lombok.Data;
import java.util.List;

@Data
public class EstimateRequestDTO {
    private String marketName;
    private List<String> products;
}
