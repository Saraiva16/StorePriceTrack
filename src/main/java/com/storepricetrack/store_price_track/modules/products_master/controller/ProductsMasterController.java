package com.storepricetrack.store_price_track.modules.products_master.controller;

import com.storepricetrack.store_price_track.modules.products_master.dto.ProductMasterDTO;
import com.storepricetrack.store_price_track.modules.products_master.dto.ProductMasterRequestDTO;
import com.storepricetrack.store_price_track.modules.products_master.dto.UpdateProductCategoryRequestDTO;
import com.storepricetrack.store_price_track.modules.products_master.service.IProductsMasterService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductsMasterController {

    private static final Logger log = LoggerFactory.getLogger(ProductsMasterController.class);

    private final IProductsMasterService productsMasterService;

    @GetMapping
    public ResponseEntity<PagedModel<ProductMasterDTO>> getAll(
            @RequestParam(required = false) String name, @PageableDefault(size = 20) Pageable pageable) {
        log.info("GET /api/products - name: {}, {}", name, pageable);
        Page<ProductMasterDTO> page = (name != null && !name.isBlank())
                ? productsMasterService.findByNamePattern(name, pageable)
                : productsMasterService.findAll(pageable);
        return ResponseEntity.ok(new PagedModel<>(page));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductMasterDTO> getById(@PathVariable Long id) {
        log.info("GET /api/products/{}", id);
        return ResponseEntity.ok(productsMasterService.getById(id));
    }

    @PostMapping
    public ResponseEntity<ProductMasterDTO> create(@Valid @RequestBody ProductMasterRequestDTO request) {
        log.info("POST /api/products - normalizedName: {}", request.normalizedName());
        ProductMasterDTO created = productsMasterService.create(
                request.normalizedName(), request.brand(), request.unitMeasure(), request.categoryId());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductMasterDTO> updateCategory(
            @PathVariable Long id, @RequestBody UpdateProductCategoryRequestDTO request) {
        log.info("PUT /api/products/{} - categoryId: {}", id, request.categoryId());
        return ResponseEntity.ok(productsMasterService.updateCategory(id, request.categoryId()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        log.warn("Not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }
}
