-- V5: Criação da tabela para armazenar links/QR Codes de NFC-e de estados ainda não suportados
CREATE TABLE IF NOT EXISTS unsupported_nfce_queue (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(2048) NOT NULL,
    state_uf VARCHAR(10),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PARSER',
    notes VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

