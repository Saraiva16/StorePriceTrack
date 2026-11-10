-- V6: Adicionar coluna de e-mail e permitir apelidos/usernames duplicados
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255) NULL UNIQUE AFTER username;

-- Remover índice de unicidade do username para permitir que mais de um usuário tenha o mesmo nick
SET @exist := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'username' AND non_unique = 0);
SET @sqlstmt := IF(@exist > 0, 'ALTER TABLE users DROP INDEX username', 'SELECT 1');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Criar índice comum não-único em username para otimizar buscas
SET @exist_idx := (SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'idx_users_username');
SET @sqlstmt_idx := IF(@exist_idx = 0, 'CREATE INDEX idx_users_username ON users(username)', 'SELECT 1');
PREPARE stmt_idx FROM @sqlstmt_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;
