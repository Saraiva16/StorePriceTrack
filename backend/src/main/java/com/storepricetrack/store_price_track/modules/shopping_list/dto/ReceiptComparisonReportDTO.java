package com.storepricetrack.store_price_track.modules.shopping_list.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ReceiptComparisonReportDTO {
    private BigDecimal estimatedTotal;
    private BigDecimal realTotal;
    private BigDecimal difference;
    private List<ReceiptItemComparisonDTO> items;

    @Data
    @Builder
    public static class ReceiptItemComparisonDTO {
        private String productName;
        private BigDecimal estimatedQuantity;
        private BigDecimal estimatedUnitPrice;
        private BigDecimal estimatedTotalPrice;
        
        private BigDecimal realQuantity;
        private BigDecimal realUnitPrice;
        private BigDecimal realTotalPrice;
        
        private BigDecimal difference;
        private boolean foundInReceipt;
        private boolean foundInList;
    }
}
