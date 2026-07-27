package com.storepricetrack.store_price_track.modules.products_master.service;

import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
import com.storepricetrack.store_price_track.modules.products_master.dto.ProductMasterDTO;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
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
class ProductsMasterServiceTest {

    @Mock
    private ProductsMasterRepository repository;

    @Mock
    private CategoriesRepository categoriesRepository;

    @InjectMocks
    private ProductsMasterService service;

    @Test
    void create_savesProductWithoutCategory_whenCategoryIdIsNull() {
        when(repository.save(any(ProductsMasterEntity.class))).thenAnswer(inv -> {
            ProductsMasterEntity e = inv.getArgument(0);
            e.setId(1L);
            return e;
        });

        ProductMasterDTO result = service.create("Arroz", "Tio Joao", "kg", null);

        assertThat(result.categoryId()).isNull();
        verify(categoriesRepository, never()).existsById(any());
    }

    @Test
    void create_linksCategory_whenCategoryExists() {
        CategoriesEntity category = new CategoriesEntity();
        category.setId(5L);
        category.setName("Graos");
        when(categoriesRepository.existsById(5L)).thenReturn(true);
        when(categoriesRepository.getReferenceById(5L)).thenReturn(category);
        when(repository.save(any(ProductsMasterEntity.class))).thenAnswer(inv -> {
            ProductsMasterEntity e = inv.getArgument(0);
            e.setId(10L);
            return e;
        });

        ProductMasterDTO result = service.create("Arroz", "Tio Joao", "kg", 5L);

        assertThat(result.categoryId()).isEqualTo(5L);
    }

    @Test
    void create_throwsNotFound_whenCategoryIdDoesNotExist() {
        when(categoriesRepository.existsById(99L)).thenReturn(false);

        assertThatThrownBy(() -> service.create("Arroz", "Tio Joao", "kg", 99L))
                .isInstanceOf(EntityNotFoundException.class);
        verify(repository, never()).save(any());
    }

    @Test
    void updateCategory_throwsNotFound_whenProductDoesNotExist() {
        when(repository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateCategory(1L, 2L))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void updateCategory_removesCategory_whenCategoryIdIsNull() {
        ProductsMasterEntity product = new ProductsMasterEntity();
        product.setId(1L);
        CategoriesEntity oldCategory = new CategoriesEntity();
        oldCategory.setId(3L);
        product.setCategory(oldCategory);

        when(repository.findById(1L)).thenReturn(Optional.of(product));
        when(repository.save(any(ProductsMasterEntity.class))).thenReturn(product);

        ProductMasterDTO result = service.updateCategory(1L, null);

        assertThat(result.categoryId()).isNull();
    }
}
