package com.storepricetrack.store_price_track.modules.categories.service;

import com.storepricetrack.store_price_track.modules.categories.dto.CategoryDTO;
import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.categories.exception.DuplicateCategoryException;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoriesServiceTest {

    @Mock
    private CategoriesRepository repository;

    @InjectMocks
    private CategoriesService service;

    @Test
    void create_savesCategory_whenNameIsUnique() {
        when(repository.findByName("Bebidas")).thenReturn(Optional.empty());
        when(repository.save(any(CategoriesEntity.class))).thenAnswer(inv -> {
            CategoriesEntity e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });

        CategoryDTO result = service.create("Bebidas");

        assertThat(result.id()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Bebidas");
    }

    @Test
    void create_throwsDuplicate_whenNameAlreadyExists() {
        CategoriesEntity existing = new CategoriesEntity();
        existing.setId(1L);
        existing.setName("Bebidas");
        when(repository.findByName("Bebidas")).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.create("Bebidas"))
                .isInstanceOf(DuplicateCategoryException.class);
    }

    @Test
    void update_throwsNotFound_whenCategoryDoesNotExist() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(1L, "Nova"))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void update_throwsDuplicate_whenNewNameBelongsToAnotherCategory() {
        CategoriesEntity toUpdate = new CategoriesEntity();
        toUpdate.setId(1L);
        toUpdate.setName("Antiga");

        CategoriesEntity other = new CategoriesEntity();
        other.setId(2L);
        other.setName("Nova");

        when(repository.findById(1L)).thenReturn(Optional.of(toUpdate));
        when(repository.findByName("Nova")).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> service.update(1L, "Nova"))
                .isInstanceOf(DuplicateCategoryException.class);
    }

    @Test
    void update_allowsCategoryToKeepItsOwnName() {
        CategoriesEntity toUpdate = new CategoriesEntity();
        toUpdate.setId(1L);
        toUpdate.setName("Bebidas");

        when(repository.findById(1L)).thenReturn(Optional.of(toUpdate));
        when(repository.findByName("Bebidas")).thenReturn(Optional.of(toUpdate));
        when(repository.save(any(CategoriesEntity.class))).thenReturn(toUpdate);

        CategoryDTO result = service.update(1L, "Bebidas");

        assertThat(result.name()).isEqualTo("Bebidas");
    }

    @Test
    void delete_throwsNotFound_whenCategoryDoesNotExist() {
        when(repository.existsById(1L)).thenReturn(false);

        assertThatThrownBy(() -> service.delete(1L))
                .isInstanceOf(EntityNotFoundException.class);
    }
}
