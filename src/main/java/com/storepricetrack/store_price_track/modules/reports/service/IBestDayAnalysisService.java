package com.storepricetrack.store_price_track.modules.reports.service;

import com.storepricetrack.store_price_track.modules.reports.dto.BestDayDTO;
import com.storepricetrack.store_price_track.modules.reports.dto.PurchasePatternDTO;

import java.util.List;

public interface IBestDayAnalysisService {

    List<BestDayDTO> getBestDaysToBuy();

    List<PurchasePatternDTO> getPurchasePattern();
}
