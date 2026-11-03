-- V4: Criação das tabelas do módulo de Controle Financeiro Pessoal
CREATE TABLE IF NOT EXISTS credit_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    bank VARCHAR(100) NOT NULL,
    credit_limit DECIMAL(12,2) NOT NULL,
    closing_day INT NOT NULL,
    due_day INT NOT NULL,
    color VARCHAR(20) DEFAULT '#89b4b1',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_credit_cards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    icon VARCHAR(50) NULL,
    color VARCHAR(20) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_financial_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS financial_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    type VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    invoice_date DATE NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    credit_card_id BIGINT NULL,
    category_id BIGINT NULL,
    installment_group_id VARCHAR(50) NULL,
    installment_number INT NOT NULL DEFAULT 1,
    total_installments INT NOT NULL DEFAULT 1,
    observation TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fin_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_fin_transactions_card FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE SET NULL,
    CONSTRAINT fk_fin_transactions_cat FOREIGN KEY (category_id) REFERENCES financial_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_fin_tx_user_date ON financial_transactions(user_id, transaction_date);
CREATE INDEX idx_fin_tx_user_invoice ON financial_transactions(user_id, invoice_date);
CREATE INDEX idx_fin_tx_group ON financial_transactions(installment_group_id);
CREATE INDEX idx_credit_cards_user ON credit_cards(user_id);
CREATE INDEX idx_fin_cat_user ON financial_categories(user_id);

-- Inserção de categorias padrão globais (user_id IS NULL)
INSERT INTO financial_categories (name, type, icon, color) VALUES
('Alimentação', 'EXPENSE', 'Utensils', '#f59c8d'),
('Moradia', 'EXPENSE', 'Home', '#e28743'),
('Transporte', 'EXPENSE', 'Car', '#eab676'),
('Lazer', 'EXPENSE', 'Film', '#89b4b1'),
('Saúde', 'EXPENSE', 'HeartPulse', '#e74c3c'),
('Educação', 'EXPENSE', 'GraduationCap', '#3498db'),
('Compras', 'EXPENSE', 'ShoppingBag', '#9b59b6'),
('Outros (Despesa)', 'EXPENSE', 'MoreHorizontal', '#95a5a6'),
('Salário', 'INCOME', 'Briefcase', '#2ecc71'),
('Investimentos', 'INCOME', 'TrendingUp', '#27ae60'),
('Freelance', 'INCOME', 'Laptop', '#1abc9c'),
('Rendimentos', 'INCOME', 'PiggyBank', '#16a085'),
('Outros (Receita)', 'INCOME', 'DollarSign', '#2ecc71');

