package com.storepricetrack.store_price_track.modules.receipts.controller;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.receipts.dto.ApproveCurationRequestDTO;
import com.storepricetrack.store_price_track.modules.receipts.dto.ReceiptCurationResponseDTO;
import com.storepricetrack.store_price_track.modules.receipts.service.ReceiptCurationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/receipt-curation")
@RequiredArgsConstructor
public class AdminReceiptCurationController {

    private final ReceiptCurationService curationService;

    private void checkAdminAccess(User user) {
        if (user == null || !"admin".equalsIgnoreCase(user.getUsername())) {
            throw new org.springframework.security.access.AccessDeniedException("Acesso restrito apenas ao administrador.");
        }
    }

    @GetMapping
    public ResponseEntity<Page<ReceiptCurationResponseDTO>> listByStatus(
            @AuthenticationPrincipal User currentUser,
            @RequestParam(defaultValue = "EM_ANALISE") String status,
            Pageable pageable) {
        checkAdminAccess(currentUser);
        return ResponseEntity.ok(curationService.getByStatus(status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReceiptCurationResponseDTO> getById(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        checkAdminAccess(currentUser);
        return ResponseEntity.ok(curationService.getById(id));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ReceiptCurationResponseDTO> approve(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id,
            @RequestBody ApproveCurationRequestDTO request) {
        checkAdminAccess(currentUser);
        return ResponseEntity.ok(curationService.approveReceipt(id, request));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Map<String, String>> reject(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long id) {
        checkAdminAccess(currentUser);
        curationService.rejectReceipt(id);
        return ResponseEntity.ok(Map.of("message", "Nota rejeitada com sucesso."));
    }

    @PostMapping("/publish-batch")
    public ResponseEntity<Map<String, Object>> publishBatch(
            @AuthenticationPrincipal User currentUser) {
        checkAdminAccess(currentUser);
        int count = curationService.publishApprovedBatch();
        return ResponseEntity.ok(Map.of(
                "message", "Notas aprovadas foram publicadas no sistema com sucesso!",
                "publishedCount", count
        ));
    }
}
