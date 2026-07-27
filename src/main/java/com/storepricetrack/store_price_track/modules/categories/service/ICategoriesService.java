package com.storepricetrack.store_price_track.modules.categories.service;

import com.storepricetrack.store_price_track.modules.categories.dto.CategoryDTO;

import java.util.List;

public interface ICategoriesService {

    List<CategoryDTO> findAll();

    CategoryDTO getById(Long id);

    CategoryDTO create(String name);

    CategoryDTO update(Long id, String name);

    void delete(Long id);
}
