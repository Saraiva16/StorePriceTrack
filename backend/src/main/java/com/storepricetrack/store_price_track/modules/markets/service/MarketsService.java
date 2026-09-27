package com.storepricetrack.store_price_track.modules.markets.service;

import com.storepricetrack.store_price_track.modules.markets.dto.MarketDTO;
import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class MarketsService implements IMarketsService {

    private static final Logger log = LoggerFactory.getLogger(MarketsService.class);

    private final MarketsRepository repository;

    @Override
    public MarketDTO findOrCreateByCnpj(String cnpj, String name, String address, String cityUf) {
        MarketsEntity market = repository.findByCnpj(cnpj)
                .orElseGet(() -> {
                    log.info("Market not found for cnpj {}, creating new one", cnpj);
                    MarketsEntity newMarket = new MarketsEntity();
                    newMarket.setCnpj(cnpj);
                    newMarket.setName(name);
                    newMarket.setAddress(address);
                    newMarket.setCityUf(cityUf);
                    return repository.save(newMarket);
                });
        return toDTO(market);
    }

    @Override
    @Transactional(readOnly = true)
    public MarketDTO getById(Long id) {
        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Market not found with id: " + id));
    }

    private MarketDTO toDTO(MarketsEntity entity) {
        return new MarketDTO(
                entity.getId(),
                entity.getName(),
                entity.getCnpj(),
                entity.getAddress(),
                entity.getCityUf()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getDistinctMarketNetworks() {
        return repository.findDistinctMarketNames();
    }
}