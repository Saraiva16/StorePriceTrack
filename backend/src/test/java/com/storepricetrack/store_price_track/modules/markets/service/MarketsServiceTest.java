package com.storepricetrack.store_price_track.modules.markets.service;

import com.storepricetrack.store_price_track.modules.markets.dto.MarketDTO;
import com.storepricetrack.store_price_track.modules.markets.entity.MarketsEntity;
import com.storepricetrack.store_price_track.modules.markets.repository.MarketsRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MarketsServiceTest {

    @Mock
    private MarketsRepository repository;

    @InjectMocks
    private MarketsService service;

    @Test
    void findOrCreateByCnpj_returnsExistingMarket_whenCnpjAlreadyExists() {
        MarketsEntity existing = new MarketsEntity();
        existing.setId(1L);
        existing.setCnpj("12.345.678/0001-90");
        existing.setName("Mercado X");
        when(repository.findByCnpj("12.345.678/0001-90")).thenReturn(Optional.of(existing));

        MarketDTO result = service.findOrCreateByCnpj("12.345.678/0001-90", "Nome Novo", "End", "SP");

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Mercado X");
        verify(repository, never()).save(any());
    }

    @Test
    void findOrCreateByCnpj_createsNewMarket_whenCnpjNotFound() {
        when(repository.findByCnpj("00.000.000/0001-00")).thenReturn(Optional.empty());
        when(repository.save(any(MarketsEntity.class))).thenAnswer(invocation -> {
            MarketsEntity toSave = invocation.getArgument(0);
            toSave.setId(2L);
            return toSave;
        });

        MarketDTO result = service.findOrCreateByCnpj("00.000.000/0001-00", "Novo Mercado", "Rua X", "RJ");

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.name()).isEqualTo("Novo Mercado");
        assertThat(result.cityUf()).isEqualTo("RJ");
    }

    @Test
    void getById_throwsEntityNotFound_whenMarketDoesNotExist() {
        when(repository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getById(99L))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
