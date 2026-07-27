package com.storepricetrack.store_price_track.modules.reports.service;

import com.storepricetrack.store_price_track.modules.reports.dto.MarketPriceComparisonDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PriceTrendPointDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.ProductPriceDTO;

import java.util.List;

public interface IPriceAnalysisService {

    List<PriceTrendPointDTO> getPriceTrend(Long productId);

    List<MarketPriceComparisonDTO> compareMarkets(Long productId);

    List<ProductPriceDTO> getCheapestProducts(int limit);

    List<ProductPriceDTO> getMostExpensiveProducts(int limit);
}
