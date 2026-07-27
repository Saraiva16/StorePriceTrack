package com.storepricetrack.store_price_track.modules.categories.service;

import com.storepricetrack.store_price_track.modules.categories.dto.CategoryDTO;
import com.storepricetrack.store_price_track.modules.categories.entity.CategoriesEntity;
import com.storepricetrack.store_price_track.modules.categories.exception.DuplicateCategoryException;
import com.storepricetrack.store_price_track.modules.categories.repository.CategoriesRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class CategoriesService implements ICategoriesService {

    private static final Logger log = LoggerFactory.getLogger(CategoriesService.class);

    private final CategoriesRepository repository;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "#pageable")
    public Page<CategoryDTO> findAll(Pageable pageable) {
        log.debug("Fetching categories page {}", pageable);
        return repository.findAll(pageable).map(this::toDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryDTO getById(Long id) {
        log.debug("Fetching category by id {}", id);
        return repository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + id));
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryDTO create(String name) {
        if (repository.findByName(name).isPresent()) {
            throw new DuplicateCategoryException("Category already exists with name: " + name);
        }
        log.info("Creating category: {}", name);
        CategoriesEntity entity = new CategoriesEntity();
        entity.setName(name);
        return toDTO(repository.save(entity));
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public CategoryDTO update(Long id, String name) {
        CategoriesEntity entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Category not found with id: " + id));
        repository.findByName(name)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new DuplicateCategoryException("Category already exists with name: " + name);
                });
        log.info("Updating category {} to name: {}", id, name);
        entity.setName(name);
        return toDTO(repository.save(entity));
    }

    @Override
    @CacheEvict(value = "categories", allEntries = true)
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Category not found with id: " + id);
        }
        log.info("Deleting category {}", id);
        repository.deleteById(id);
    }

    private CategoryDTO toDTO(CategoriesEntity entity) {
        return new CategoryDTO(entity.getId(), entity.getName());
    }
}
