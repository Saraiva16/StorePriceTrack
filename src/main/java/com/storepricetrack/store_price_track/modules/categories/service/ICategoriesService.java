package com.storepricetrack.store_price_track.modules.categories.service;

import com.storepricetrack.store_price_track.modules.categories.dto.CategoryDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ICategoriesService {

    Page<CategoryDTO> findAll(Pageable pageable);

    CategoryDTO getById(Long id);

    CategoryDTO create(String name);

    CategoryDTO update(Long id, String name);

    void delete(Long id);
}
