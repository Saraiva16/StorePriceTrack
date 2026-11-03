package com.storepricetrack.store_price_track.modules.finance.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.finance.dto.CategoryDto;
import com.storepricetrack.store_price_track.modules.finance.dto.CategoryRequestDto;
import com.storepricetrack.store_price_track.modules.finance.entity.FinancialCategory;
import com.storepricetrack.store_price_track.modules.finance.repository.FinancialCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FinancialCategoryService {

    private final FinancialCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> getCategories(User user) {
        return categoryRepository.findAllAvailableForUser(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public CategoryDto createCustomCategory(CategoryRequestDto dto, User user) {
        FinancialCategory category = FinancialCategory.builder()
                .user(user)
                .name(dto.getName().trim())
                .type(dto.getType())
                .icon(dto.getIcon() != null && !dto.getIcon().isBlank() ? dto.getIcon() : "Tag")
                .color(dto.getColor() != null && !dto.getColor().isBlank() ? dto.getColor() : "#89b4b1")
                .build();

        FinancialCategory saved = categoryRepository.save(category);
        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public FinancialCategory findCategoryEntityOrThrow(Long id, Long userId) {
        FinancialCategory category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Categoria não encontrada"));

        // Se for categoria customizada, checar se pertence ao usuário
        if (category.getUser() != null && !category.getUser().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso não autorizado a esta categoria");
        }

        return category;
    }

    public CategoryDto toDto(FinancialCategory category) {
        return CategoryDto.builder()
                .id(category.getId())
                .name(category.getName())
                .type(category.getType())
                .icon(category.getIcon())
                .color(category.getColor())
                .custom(category.getUser() != null)
                .build();
    }
}

