package com.storepricetrack.store_price_track.modules.categories.controller;

import com.storepricetrack.store_price_track.modules.categories.dto.CategoryDTO;
import com.storepricetrack.store_price_track.modules.categories.dto.CategoryRequestDTO;
import com.storepricetrack.store_price_track.modules.categories.exception.DuplicateCategoryException;
import com.storepricetrack.store_price_track.modules.categories.service.ICategoriesService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoriesController {

    private static final Logger log = LoggerFactory.getLogger(CategoriesController.class);

    private final ICategoriesService categoriesService;

    @GetMapping
    public ResponseEntity<PagedModel<CategoryDTO>> getAll(@PageableDefault(size = 20) Pageable pageable) {
        log.info("GET /api/categories - {}", pageable);
        return ResponseEntity.ok(new PagedModel<>(categoriesService.findAll(pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CategoryDTO> getById(@PathVariable Long id) {
        log.info("GET /api/categories/{}", id);
        return ResponseEntity.ok(categoriesService.getById(id));
    }

    @PostMapping
    public ResponseEntity<CategoryDTO> create(@Valid @RequestBody CategoryRequestDTO request) {
        log.info("POST /api/categories - name: {}", request.name());
        CategoryDTO created = categoriesService.create(request.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDTO> update(@PathVariable Long id, @Valid @RequestBody CategoryRequestDTO request) {
        log.info("PUT /api/categories/{} - name: {}", id, request.name());
        return ResponseEntity.ok(categoriesService.update(id, request.name()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/categories/{}", id);
        categoriesService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        log.warn("Category not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(DuplicateCategoryException.class)
    public ResponseEntity<Map<String, String>> handleDuplicate(DuplicateCategoryException ex) {
        log.warn("Duplicate category: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ex.getMessage()));
    }
}
