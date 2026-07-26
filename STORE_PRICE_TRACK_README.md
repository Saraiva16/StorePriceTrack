# Store Price Track - Documentação do Projeto

> Status: 🏗️ Em desenvolvimento | Última atualização: Julho 2026

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Objetivo e Escopo](#objetivo-e-escopo)
3. [Stack Técnico](#stack-técnico)
4. [Arquitetura](#arquitetura)
5. [Modelo de Dados](#modelo-de-dados)
6. [Fluxo de Dados](#fluxo-de-dados)
7. [Roadmap de Desenvolvimento](#roadmap-de-desenvolvimento)
8. [Padrões e Convenções](#padrões-e-convenções)
9. [Configurações Importantes](#configurações-importantes)

---

## 🎯 Visão Geral

**Store Price Track** é um backend em Spring Boot para digitalizar, processar e analisar recibos de compras em supermercados. O sistema extrai automaticamente informações estruturadas de fotos de recibos usando Google AI Studio e armazena os dados para análise histórica de preços.

### Problema que resolve
- ❌ ~300 recibos físicos sem análise
- ✅ Histórico digital de compras
- ✅ Análise de tendências de preço por produto/mercado
- ✅ Identificação de padrões de compra

---

## 🎯 Objetivo e Escopo

### Objetivo Principal
Criar um repositório centralizado e consultável de histórico de compras que permita:
- Rastrear variações de preço ao longo do tempo
- Comparar preços entre mercados
- Identificar os melhores dias para comprar
- Analisar padrões de consumo

### Escopo Fase 1 (Atual)
- ✅ Modelo de dados completo
- ✅ Camada de persistência (JPA/Hibernate)
- ✅ Importação de recibos com Google AI Studio
- 🔄 Serviços de consulta e histórico
- 🔄 Normalização de produtos
- ⏳ APIs de relatório e análise

### Fora do Escopo (Por Enquanto)
- Front-end web/mobile
- Autenticação de usuários
- Gerenciamento de múltiplas lojas por usuário

---

## 🛠️ Stack Técnico

```
Backend:
├── Spring Boot 3.x
├── Spring Data JPA / Hibernate
├── Lombok (redução de boilerplate)
├── MySQL 8.0+
└── Jackson (serialização JSON)

Integrações Externas:
├── Google AI Studio (processamento de recibos)
└── Git/GitHub (versionamento)

Build & Runtime:
├── Maven
├── Java 17+
└── Docker (opcional)
```

---

## 🏛️ Arquitetura

### Camadas do Projeto

```
┌─────────────────────────────────────────┐
│     Controller Layer (REST API)         │
│  (ReceiptImportController, etc.)        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      Service Layer (Business Logic)     │
│  (ReceiptImportService,                 │
│   MarketsService, etc.)                 │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│     Repository Layer (Data Access)      │
│  (JPA Repositories)                     │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       Persistence Layer (JPA/ORM)       │
│  (Entity Classes, Hibernate)            │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       Database Layer (MySQL)            │
└─────────────────────────────────────────┘
```

### Integração Externa: Google AI Studio

```
                    Usuário (POST /api/receipts/import)
                              │
                              ▼
                    ReceiptImportController
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
    Validação                            ReceiptImportService
        │                                           │
        │        ┌──────────────────────────────────┤
        │        │                                  │
        │        ▼                                  ▼
        │    Google AI Studio API          Duplicate Detection
        │        │                          (via access_key)
        │        ▼                                  │
        │    JSON Estruturado                      │
        │        │                                 │
        └────────┴─────────────────────────────────┤
                                                    │
                                                    ▼
                                            MarketsService
                                            (find-or-create)
                                                    │
                                                    ▼
                                            Persistência no DB
```

---

## 💾 Modelo de Dados

### Tabelas Principais

#### 1. **markets**
Armazena informações de supermercados/lojas.

```sql
┌─────────────────────────────────────┐
│          MARKETS                    │
├─────────────────────────────────────┤
│ id (BIGINT, PK, AI)                 │
│ name (VARCHAR 255, NOT NULL)        │
│ cnpj (VARCHAR 18, UNIQUE)           │
│ address (TEXT)                      │
│ city_uf (VARCHAR 50)                │
│ created_at (TIMESTAMP)              │
└─────────────────────────────────────┘
```

#### 2. **categories**
Categorias de produtos (frutas, laticínios, carnes, etc.)

```sql
┌─────────────────────────────────────┐
│       CATEGORIES                    │
├─────────────────────────────────────┤
│ id (BIGINT, PK, AI)                 │
│ name (VARCHAR 255, UNIQUE, NOT NULL)│
│ created_at (TIMESTAMP)              │
└─────────────────────────────────────┘
```

#### 3. **products_master**
Catálogo centralizado de produtos (nome normalizado + categoria).

```sql
┌──────────────────────────────────────┐
│     PRODUCTS_MASTER                  │
├──────────────────────────────────────┤
│ id (BIGINT, PK, AI)                  │
│ category_id (BIGINT, FK → categories)│
│ normalized_name (VARCHAR 255, NOT NULL)│
│ brand (VARCHAR 100)                  │
│ unit_measure (VARCHAR 10, DEFAULT 'un')│
│ created_at (TIMESTAMP)               │
└──────────────────────────────────────┘
```

#### 4. **receipts**
Recibos importados (um por foto/visita ao mercado).

```sql
┌───────────────────────────────────────┐
│          RECEIPTS                     │
├───────────────────────────────────────┤
│ id (BIGINT, PK, AI)                   │
│ market_id (BIGINT, FK → markets)      │
│ purchase_date (DATETIME, NOT NULL)    │
│ total_amount (DECIMAL 12,2, NOT NULL) │
│ image_url (VARCHAR 512)               │
│ access_key (CHAR 44, UNIQUE)          │
│ created_at (TIMESTAMP)                │
└───────────────────────────────────────┘
```

**Índices recomendados:**
- `UNIQUE INDEX (access_key)` — detecção de duplicatas
- `INDEX (market_id, purchase_date)` — queries de histórico por mercado

#### 5. **receipt_items**
Itens individuais de cada recibo (linhas do recibo).

```sql
┌───────────────────────────────────────┐
│      RECEIPT_ITEMS                    │
├───────────────────────────────────────┤
│ id (BIGINT, PK, AI)                   │
│ receipt_id (BIGINT, FK → receipts)    │
│ product_id (BIGINT, FK → products_master)│
│ original_name_on_receipt (VARCHAR 255)│
│ quantity (DECIMAL 12,3)               │
│ unit_price (DECIMAL 12,2)             │
│ total_price (DECIMAL 12,2)            │
└───────────────────────────────────────┘
```

### Relacionamentos

```
MARKETS (1) ──────────────── (N) RECEIPTS
             1 para muitos
                                    │
                                    │ 1 para muitos
                                    │
                            RECEIPT_ITEMS (N)
                                    │
                                    │ muitos para 1
                                    │
                            PRODUCTS_MASTER
                                    │
                                    │ muitos para 1
                                    │
                            CATEGORIES
```

---

## 🔄 Fluxo de Dados

### Fluxo End-to-End: Importação de Recibo

```
1. USUÁRIO ENVIA FOTO DO RECIBO
   └─→ POST /api/receipts/import
       Content-Type: multipart/form-data
       Body: foto do recibo

2. CONTROLLER (ReceiptImportController)
   └─→ Validação básica da foto
   └─→ Chama ReceiptImportService

3. SERVICE (ReceiptImportService)
   ├─→ Envia foto para Google AI Studio
   ├─→ Extrai JSON com:
   │   ├─ market_name
   │   ├─ cnpj
   │   ├─ purchase_date
   │   ├─ total
   │   ├─ access_key
   │   └─ line_items[] (nome, qtd, preço)
   │
   ├─→ Verifica duplicata (access_key já existe?)
   │   ├─ SIM: Retorna erro 409 Conflict
   │   └─ NÃO: Continua
   │
   └─→ Persiste dados:
       ├─ Chama MarketsService.findOrCreateByCanpj()
       ├─ Cria Receipt (tabela receipts)
       └─ Cria ReceiptItems (tabela receipt_items)

4. RESPOSTA AO USUÁRIO
   └─→ HTTP 200 + Receipt ID
       ou
       HTTP 409 + "Recibo duplicado"
       ou
       HTTP 400 + "Erro ao processar"
```

### Desserialização JSON

O Google AI Studio retorna JSON em **snake_case**, ex:
```json
{
  "market_name": "Mercado XYZ",
  "cnpj": "12.345.678/0001-90",
  "purchase_date": "2026-07-25",
  "total": "150.50",
  "access_key": "abc123def456"
}
```

**Configuração necessária** em `application.properties`:
```properties
spring.jackson.property-naming-strategy=SNAKE_CASE
```

---

## 🗂️ Roadmap de Desenvolvimento

### 🔄 Fase 1: Estrutura Base e Importação (EM PROGRESSO)

- [x] Modelo de dados (5 tabelas)
- [x] Entities JPA (Market, Category, ProductMaster, Receipt, ReceiptItem)
- [x] Repositories JPA
- [x] Configuração de datasource e Jackson SNAKE_CASE
- [ ] DTOs de Market, Category e ProductMaster
- [ ] MarketsService (find-or-create)
- [ ] ReceiptImportService (orquestração completa)
- [ ] ReceiptImportController (endpoint POST /api/receipts/import)

### 🔄 Fase 2: Serviços de Consulta e Histórico (EM PROGRESSO)

- [ ] **ReceiptsService**
  - Listar recibos por mercado
  - Listar recibos por período
  - Obter detalhes de um recibo
  - Histórico de compras (últimos N meses)

- [ ] **ReceiptItemsService**
  - Filtrar itens por produto
  - Calcular preço médio histórico
  - Variação de preço (min/max/média)
  - Top produtos mais comprados

### 🔄 Fase 3: Normalização de Produtos (EM PROGRESSO)

- [ ] **ProductsMasterService**
  - Listar todos os produtos
  - Criar produto manualmente
  - Atualizar categoria de produto
  - Buscar produtos por padrão de nome

- [ ] **CategoriesService**
  - CRUD de categorias
  - Manter lista padrão de categorias

- [ ] **Normalização Automática**
  - Detectar produtos duplicados (mesma coisa, nomes diferentes)
  - Sugerir agrupamentos
  - Mapear nomes do recibo para produtos_master

### ⏳ Fase 4: APIs de Análise e Relatório

- [ ] **PriceAnalysisService**
  - Tendência de preço (histórico)
  - Comparação entre mercados
  - Produtos mais caros/baratos

- [ ] **BestDayAnalysisService**
  - Qual dia da semana tem melhor promoção?
  - Padrão de compra por data

- [ ] **ReportController**
  - GET /api/reports/price-trends
  - GET /api/reports/market-comparison
  - GET /api/reports/best-shopping-days

### ⏳ Fase 5: Melhorias e Otimizações

- [ ] Paginação em queries
- [ ] Cache de dados frequentes
- [ ] Validação de dados mais robusta
- [ ] Testes unitários e integração
- [ ] Documentação Swagger/OpenAPI

---

## 📐 Padrões e Convenções

### Estrutura de Pacotes

O projeto é organizado **por módulo de domínio** (não por camada técnica). Cada módulo agrupa suas próprias `entity/`, `repository/`, `dto/`, `service/` e `controller/`:

```
com.storepricetrack.store_price_track
├── modules/
│   ├── markets/
│   │   ├── entity/MarketsEntity
│   │   ├── repository/MarketsRepository
│   │   ├── dto/           # (a criar)
│   │   └── service/       # (a criar)
│   ├── categories/
│   │   ├── entity/CategoriesEntity
│   │   └── repository/CategoriesRepository
│   ├── products_master/
│   │   ├── entity/ProductsMasterEntity
│   │   └── repository/ProductsMasterRepository
│   ├── receipts/
│   │   ├── entity/ReceiptsEntity
│   │   ├── repository/ReceiptsRepository
│   │   └── dto/ReceiptResponseDTO
│   └── receipt_items/
│       ├── entity/ReceiptItemsEntity
│       ├── repository/ReceiptItemsRepository
│       └── dto/ReceiptItemDTO
└── config/               # Configurações (a criar)
    └── JacksonConfig
```

Ao criar um novo serviço/controller para um módulo, adicione-o dentro do pacote `modules/{nome-do-modulo}/`, e não em um pacote `service/`/`controller/` na raiz.

### Convenções de Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Entity | Singular, PascalCase | `Market`, `Receipt` |
| Repository | `{Entity}Repository` | `MarketRepository` |
| Service | `{Entity}Service` | `MarketsService` |
| Controller | `{Entity}Controller` | `ReceiptImportController` |
| DTO Request | `{Action}{Entity}Request` | `ReceiptImportRequest` |
| DTO Response | `{Entity}Response` | `ReceiptResponse` |
| Método findBy | `findBy{Field}` | `findByCnpj()` |
| Método getBy | `getBy{Field}OrThrow` | `getByCnpjOrThrow()` |

### Padrão de Resposta

**Sucesso:**
```json
{
  "status": "success",
  "data": { /* dados */ },
  "timestamp": "2026-07-25T10:30:00Z"
}
```

**Erro:**
```json
{
  "status": "error",
  "message": "Descrição do erro",
  "code": "ERROR_CODE",
  "timestamp": "2026-07-25T10:30:00Z"
}
```

---

## ⚙️ Configurações Importantes

### `application.properties`

```properties
# Banco de Dados
spring.datasource.url=jdbc:mysql://localhost:3306/store_price_track
spring.datasource.username=root
spring.datasource.password=sua_senha
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
spring.jpa.properties.hibernate.format_sql=true

# Jackson (CRUCIAL para Google AI Studio)
spring.jackson.property-naming-strategy=SNAKE_CASE

# Aplicação
spring.application.name=store-price-track
server.port=8080
server.servlet.context-path=/
```

### Variáveis de Ambiente

```bash
# Google AI Studio
GOOGLE_AI_API_KEY=sua_chave_api

# Banco de dados (opcional, se quiser sobrescrever)
DB_URL=jdbc:mysql://localhost:3306/store_price_track
DB_USER=root
DB_PASSWORD=sua_senha
```

### Schema MySQL (Referência)

```sql
CREATE DATABASE IF NOT EXISTS store_price_track;
USE store_price_track;

-- Será criado automaticamente pelo Hibernate na primeira vez
-- (dependendo de spring.jpa.hibernate.ddl-auto=update)
```

---

## 🚀 Como Começar

### 1. Clonar e configurar
```bash
git clone https://github.com/seu-usuario/store-price-track.git
cd store-price-track
```

### 2. Configurar `application.properties`
```bash
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties
# Editar com suas credenciais
```

### 3. Build e Run
```bash
mvn clean install
mvn spring-boot:run
```

### 4. Testar importação
```bash
curl -X POST http://localhost:8080/api/receipts/import \
  -F "file=@/path/to/receipt.jpg"
```

---

## 📝 Notas e Observações

- **Duplicatas:** Recibos com mesmo `access_key` são rejeitados (409 Conflict)
- **Transações:** Toda importação é uma transação (all-or-nothing)
- **Índices:** PKs em `BIGINT AUTO_INCREMENT` por consistência
- **Timestamps:** Todos os entities têm `created_at` e `updated_at` (quando aplicável)
- **Lombok:** Reduz boilerplate com `@Getter`, `@Setter`, `@NoArgsConstructor`, etc.

---

## 📞 Próximas Etapas

1. **Fase 2**: Implementar `ReceiptsService` e `ReceiptItemsService`
2. **Validação**: Adicionar testes unitários e de integração
3. **Documentação**: Expandir com exemplos de API
4. **Performance**: Analisar queries lentas e otimizar

---

*Documentação atualizada: Julho 2026*  
*Mateus — Store Price Track*
