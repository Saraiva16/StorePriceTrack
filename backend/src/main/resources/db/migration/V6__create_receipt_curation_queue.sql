-- V6: Fila de Curadoria de Notas Fiscais (Staging com Moderação Admin)
CREATE TABLE IF NOT EXISTS receipt_curation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    source_url VARCHAR(2048) NULL,
    access_key VARCHAR(50) NULL,
    market_name VARCHAR(255) NULL,
    market_cnpj VARCHAR(20) NULL,
    purchase_date DATETIME NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'EM_ANALISE',
    raw_payload MEDIUMTEXT NULL,
    items_payload MEDIUMTEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_receipt_curation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_receipt_curation_status ON receipt_curation(status);
CREATE INDEX idx_receipt_curation_user ON receipt_curation(user_id);
CREATE INDEX idx_receipt_curation_key ON receipt_curation(access_key);
