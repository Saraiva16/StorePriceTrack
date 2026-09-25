package com.storepricetrack.store_price_track.modules.products_master.service;

import com.storepricetrack.store_price_track.modules.products_master.dto.ProductMasterDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface IProductsMasterService {

    Page<ProductMasterDTO> findAll(Pageable pageable);

    ProductMasterDTO getById(Long id);

    ProductMasterDTO create(String normalizedName, String brand, String unitMeasure, Long categoryId);

    ProductMasterDTO updateCategory(Long productId, Long categoryId);

    Page<ProductMasterDTO> findByNamePattern(String pattern, Pageable pageable);
}
