-- Adiciona índice na coluna original_name_on_receipt para viabilizar busca rápida do De-Para histórico de itens de NFC-e
CREATE INDEX idx_receipt_items_original_name ON receipt_items(original_name_on_receipt);
