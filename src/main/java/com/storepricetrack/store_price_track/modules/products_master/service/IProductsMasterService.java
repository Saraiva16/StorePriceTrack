package com.storepricetrack.store_price_track.modules.products_master.service;

import com.storepricetrack.store_price_track.modules.products_master.dto.ProductMasterDTO;

import java.util.List;

public interface IProductsMasterService {

    List<ProductMasterDTO> findAll();

    ProductMasterDTO getById(Long id);

    ProductMasterDTO create(String normalizedName, String brand, String unitMeasure, Long categoryId);

    ProductMasterDTO updateCategory(Long productId, Long categoryId);

    List<ProductMasterDTO> findByNamePattern(String pattern);
}
