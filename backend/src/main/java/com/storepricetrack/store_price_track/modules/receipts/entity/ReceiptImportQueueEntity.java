package com.storepricetrack.store_price_track.modules.receipts.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "receipt_import_queue")
@Getter
@Setter
public class ReceiptImportQueueEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @Column(name = "image_bytes", nullable = false, columnDefinition = "LONGBLOB")
    private byte[] imageBytes;

    @Column(name = "mime_type", length = 50)
    private String mimeType;

    @Column(length = 20, nullable = false)
    private String status = "PENDING"; // PENDING, PROCESSED, ERROR

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;
}
