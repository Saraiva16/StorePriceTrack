package com.storepricetrack.store_price_track.modules.products_master.service;

import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
import com.storepricetrack.store_price_track.modules.products_master.dto.ProductMasterDTO;
import com.storepricetrack.store_price_track.modules.products_master.entity.ProductsMasterEntity;
import com.storepricetrack.store_price_track.modules.products_master.repository.ProductsMasterRepository;
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
public class ProductsMasterService implements IProductsMasterService {

    private static final Logger log = LoggerFactory.getLogger(ProductsMasterService.class);

    private final ProductsMasterRepository repository;
    private final CategoriesRepository categoriesRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProductMasterDTO> findAll() {
        log.debug("Fetching all products");
        return repository.findAll().stream().map(this::toDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductMasterDTO getById(Long id) {
        log.debug("Fetching product by id {}", id);
        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Product not found with id: " + id));
    }

    @Override
    public ProductMasterDTO create(String normalizedName, String brand, String unitMeasure, Long categoryId) {
        log.info("Creating product: {}", normalizedName);
        ProductsMasterEntity entity = new ProductsMasterEntity();
        entity.setNormalizedName(normalizedName);
        entity.setBrand(brand);
        entity.setUnitMeasure(unitMeasure);
        entity.setCategory(resolveCategory(categoryId));
        return toDTO(repository.save(entity));
    }

    @Override
    public ProductMasterDTO updateCategory(Long productId, Long categoryId) {
        ProductsMasterEntity entity = repository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Product not found with id: " + productId));
        log.info("Updating category of product {} to {}", productId, categoryId);
        entity.setCategory(resolveCategory(categoryId));
        return toDTO(repository.save(entity));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductMasterDTO> findByNamePattern(String pattern) {
        log.debug("Searching products by name pattern: {}", pattern);
        return repository.findByNormalizedNameContainingIgnoreCase(pattern).stream()
                .map(this::toDTO)
                .toList();
    }

    private CategoriesEntity resolveCategory(Long categoryId) {
        if (categoryId == null) {
            return null;
        }
        if (!categoriesRepository.existsById(categoryId)) {
            throw new EntityNotFoundException("Category not found with id: " + categoryId);
        }
        return categoriesRepository.getReferenceById(categoryId);
    }

    private ProductMasterDTO toDTO(ProductsMasterEntity entity) {
        Long categoryId = entity.getCategory() != null ? entity.getCategory().getId() : null;
        return new ProductMasterDTO(entity.getId(), entity.getNormalizedName(), entity.getBrand(), entity.getUnitMeasure(), categoryId);
    }
}
