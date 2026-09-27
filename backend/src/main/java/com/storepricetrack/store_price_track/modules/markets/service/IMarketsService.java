package com.storepricetrack.store_price_track.modules.markets.service;

import com.storepricetrack.store_price_track.modules.markets.dto.MarketDTO;
import java.util.List;

public interface IMarketsService {

    MarketDTO findOrCreateByCnpj(String cnpj, String name, String address, String cityUf);

    MarketDTO getById(Long id);

    List<String> getDistinctMarketNetworks();
}