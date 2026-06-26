-- 1. Mercados
CREATE TABLE markets (
    id CHAR(36) PRIMARY KEY, -- Usando String para UUID no MySQL
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    address TEXT,
    city_uf VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Categorias
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Produtos Mestre (Base Normalizada)
CREATE TABLE products_master (
    id CHAR(36) PRIMARY KEY,
    category_id CHAR(36),
    normalized_name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    unit_measure VARCHAR(10) DEFAULT 'un',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- 4. Notas Fiscais (Cabeçalho)
CREATE TABLE receipts (
    id CHAR(36) PRIMARY KEY,
    market_id CHAR(36),
    purchase_date DATETIME NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    image_url VARCHAR(512),
    access_key CHAR(44) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_market FOREIGN KEY (market_id) REFERENCES markets(id) ON DELETE CASCADE
);

-- 5. Itens da Nota
CREATE TABLE receipt_items (
    id CHAR(36) PRIMARY KEY,
    receipt_id CHAR(36),
    product_id CHAR(36),
    original_name_on_receipt VARCHAR(255) NOT NULL,
    quantity DECIMAL(12, 3) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_receipt FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_master FOREIGN KEY (product_id) REFERENCES products_master(id) ON DELETE SET NULL
);