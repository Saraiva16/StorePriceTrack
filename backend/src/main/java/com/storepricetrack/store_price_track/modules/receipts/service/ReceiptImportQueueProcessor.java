package com.storepricetrack.store_price_track.modules.receipts.service;

import com.storepricetrack.store_price_track.modules.receipts.entity.ReceiptImportQueueEntity;
import com.storepricetrack.store_price_track.modules.receipts.repository.ReceiptImportQueueRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.InputStream;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReceiptImportQueueProcessor {

    private static final Logger log = LoggerFactory.getLogger(ReceiptImportQueueProcessor.class);

    private final ReceiptImportQueueRepository queueRepository;
    private final IReceiptImportService receiptImportService;

    // Roda a cada 2 horas
    @Scheduled(fixedDelay = 2 * 60 * 60 * 1000)
    public void processQueue() {
        List<ReceiptImportQueueEntity> pendingItems = queueRepository.findByStatusOrderByCreatedAtAsc("PENDING");
        
        if (pendingItems.isEmpty()) {
            return;
        }

        log.info("Iniciando processamento da fila de recibos ({} itens)...", pendingItems.size());

        for (ReceiptImportQueueEntity item : pendingItems) {
            try {
                MultipartFile mockFile = new MultipartFile() {
                    @Override
                    public String getName() { return "file"; }
                    @Override
                    public String getOriginalFilename() { return "queue_image.jpg"; }
                    @Override
                    public String getContentType() { return item.getMimeType(); }
                    @Override
                    public boolean isEmpty() { return item.getImageBytes() == null || item.getImageBytes().length == 0; }
                    @Override
                    public long getSize() { return item.getImageBytes().length; }
                    @Override
                    public byte[] getBytes() { return item.getImageBytes(); }
                    @Override
                    public InputStream getInputStream() { return new ByteArrayInputStream(item.getImageBytes()); }
                    @Override
                    public void transferTo(File dest) throws java.io.IOException, IllegalStateException {
                        java.nio.file.Files.write(dest.toPath(), item.getImageBytes());
                    }
                };
                
                receiptImportService.importReceipt(mockFile);
                
                item.setStatus("PROCESSED");
                item.setErrorMessage(null);
                queueRepository.save(item);
                log.info("Item da fila {} processado com sucesso!", item.getId());
                
            } catch (Exception e) {
                log.error("Falha ao processar item da fila {}", item.getId(), e);
                // Se der 503 de novo, ele continua como PENDING para a próxima tentativa?
                // Se a exception for re-lancada pelo service, a gente pega aqui.
                if (e.getMessage() != null && e.getMessage().contains("503")) {
                    item.setStatus("PENDING");
                    item.setErrorMessage(e.getMessage());
                } else {
                    item.setStatus("ERROR");
                    item.setErrorMessage(e.getMessage() != null ? e.getMessage() : e.toString());
                }
                queueRepository.save(item);
            }
        }
    }
}
