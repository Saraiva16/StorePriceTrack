# Store Price Track — Glossário e Acrônimos

> Definições de termos, conceitos e acrônimos usados no projeto

---

## 📚 Glossário de Termos

### Domínio (Negócio)

| Termo | Definição | Exemplo |
|-------|-----------|---------|
| **Recibo** | Documento fiscal emitido por um supermercado após compra | Foto de recibo de supermercado |
| **Mercado** | Estabelecimento comercial (supermercado, mercearia, etc.) | Mercado X, Carrefour, Pão de Açúcar |
| **CNPJ** | Cadastro Nacional da Pessoa Jurídica (ID único da empresa) | 12.345.678/0001-90 |
| **Access Key** | Identificador único do recibo fornecido pelo Google AI | `abc123def456...` |
| **Linha de Recibo** | Um item individual comprado (produto + qtd + preço) | 1x Arroz 5kg = R$ 25,00 |
| **Categoria** | Grupo de produtos (frutas, laticínios, carnes, etc.) | Frutas, Bebidas, Alimentos Secos |
| **Produto** | Bem individual com identificação única no sistema | "Arroz Integral 5kg", "Leite Integral 1L" |
| **Preço Histórico** | Série de preços de um produto ao longo do tempo | Arroz: Jan R$20, Fev R$22, Mar R$21 |
| **Normalização** | Processo de padronização de nomes e categorias | "Arroz branco" = "Arroz" = "ARROZ 5KG" |

### Técnico (Código)

| Termo | Definição | Exemplo |
|-------|-----------|---------|
| **Entity** | Classe Java mapeada para tabela do banco (JPA) | `Receipt.java`, `Market.java` |
| **Repository** | Interface que fornece acesso aos dados (CRUD) | `ReceiptRepository.findById()` |
| **Service** | Camada de lógica de negócio | `ReceiptImportService` |
| **Controller** | Camada que expõe endpoints REST | `ReceiptImportController` |
| **DTO** | Data Transfer Object (objeto para serialização/desserialização) | `ReceiptDTO`, `ReceiptImportRequest` |
| **DAO** | Data Access Object (padrão de acesso a dados) | Implementado por `Repository` |
| **ORM** | Object-Relational Mapping (mapeia objetos para tabelas) | Hibernate é um ORM |
| **JPA** | Java Persistence API (padrão de persistência) | Implementado por Hibernate |
| **Transação** | Operação atômica (tudo ou nada) no banco | `@Transactional` garante atomicidade |
| **Query Method** | Método derivado de nomes (Spring Data) | `findByMarketId()` |
| **Custom Query** | Query JPQL/SQL escrita manualmente | `@Query("SELECT r FROM Receipt r...")` |
| **Lazy Loading** | Carregamento sob demanda de dados relacionados | Fetches apenas quando acessado |
| **Eager Loading** | Carregamento antecipado de dados relacionados | Fetches junto com a entidade principal |
| **Desserialização** | Conversão de JSON para objeto Java | `ObjectMapper.readValue(json, Receipt.class)` |
| **Serialização** | Conversão de objeto Java para JSON | `ObjectMapper.writeValueAsString(receipt)` |

### Cloud & Integração

| Termo | Definição | Exemplo |
|-------|-----------|---------|
| **Google AI Studio** | Serviço da Google que extrai dados de imagens | Processa foto de recibo e retorna JSON |
| **API** | Application Programming Interface (contrato de comunicação) | POST /api/receipts/import |
| **REST** | Representational State Transfer (estilo arquitetural) | HTTP + JSON |
| **HTTP Status** | Código de retorno da requisição | 200 OK, 404 Not Found, 409 Conflict |
| **Multipart Form** | Formato para upload de arquivos | Content-Type: multipart/form-data |

---

## 🔤 Acrônimos e Siglas

### Projeto & Produto

| Sigla | Significado | Contexto |
|-------|------------|---------|
| **SPT** | Store Price Track | Nome abreviado do projeto |

### Tecnologia

| Sigla | Significado | Contexto |
|-------|------------|---------|
| **JPA** | Java Persistence API | Padrão de persistência em Java |
| **ORM** | Object-Relational Mapping | Hibernate implementa ORM |
| **DAO** | Data Access Object | Padrão de acesso a dados |
| **DTO** | Data Transfer Object | Objeto para transferência de dados |
| **CRUD** | Create, Read, Update, Delete | Operações básicas |
| **REST** | Representational State Transfer | Estilo de API HTTP |
| **JSON** | JavaScript Object Notation | Formato de dados |
| **SQL** | Structured Query Language | Linguagem de banco de dados |
| **JPQL** | Java Persistence Query Language | Query language do JPA |
| **HTTP** | HyperText Transfer Protocol | Protocolo web |

### Database

| Sigla | Significado | Contexto |
|-------|------------|---------|
| **PK** | Primary Key | Chave primária |
| **FK** | Foreign Key | Chave estrangeira |
| **AI** | Auto Increment | Geração automática de ID |
| **BIGINT** | Big Integer (64-bit) | Tipo de coluna para IDs |
| **DECIMAL** | Decimal (precisão fixa) | Tipo para valores monetários |
| **TIMESTAMP** | Data e hora | Tipo para registros de auditoria |
| **UNIQUE** | Restrição de unicidade | Nenhum valor duplicado |
| **INDEX** | Índice de banco | Aceleração de queries |
| **CNPJ** | Cadastro Nacional da Pessoa Jurídica | ID da empresa |

### Brasil & Fiscal

| Sigla | Significado | Contexto |
|-------|------------|---------|
| **CNPJ** | Cadastro Nacional da Pessoa Jurídica | ID único de empresa no Brasil |
| **NF** | Nota Fiscal | Documento fiscal (recibo) |
| **NF-e** | Nota Fiscal eletrônica | Versão digital da nota fiscal |

---

## 🎯 Tabelas do Banco em Resumo

```
┌──────────────────────────────────────────────────────────────────┐
│                         BANCO DE DADOS                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  MARKETS                                                         │
│  ├─ id (PK)                                                      │
│  ├─ cnpj (UNIQUE)                                                │
│  ├─ name                                                         │
│  └─ timestamps                                                   │
│                                                                  │
│  RECEIPTS (importações)                                          │
│  ├─ id (PK)                                                      │
│  ├─ market_id (FK → MARKETS)                                    │
│  ├─ access_key (UNIQUE) ← Google AI                              │
│  ├─ purchase_date                                                │
│  ├─ total (R$)                                                   │
│  └─ timestamps                                                   │
│                                                                  │
│  RECEIPT_ITEMS (linhas do recibo)                                │
│  ├─ id (PK)                                                      │
│  ├─ receipt_id (FK → RECEIPTS)                                  │
│  ├─ product_id (FK → PRODUCTS_MASTER)                           │
│  ├─ quantity                                                     │
│  ├─ unit_price                                                   │
│  ├─ total_price                                                  │
│  └─ timestamps                                                   │
│                                                                  │
│  PRODUCTS_MASTER (catálogo centralizado)                         │
│  ├─ id (PK)                                                      │
│  ├─ name                                                         │
│  ├─ category_id (FK → CATEGORIES)                               │
│  ├─ normalized_name ← para matching                              │
│  └─ timestamps                                                   │
│                                                                  │
│  CATEGORIES                                                      │
│  ├─ id (PK)                                                      │
│  ├─ name (UNIQUE)                                                │
│  └─ timestamps                                                   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Importação (Resumido)

```
Usuário
  ↓ [POST /api/receipts/import]
ReceiptImportController (validação)
  ↓
ReceiptImportService (orquestração)
  ├─ Envia foto para Google AI Studio
  ├─ Recebe JSON estruturado
  ├─ Verifica duplicata (access_key)
  ├─ Chama MarketsService.findOrCreateByCanpj()
  ├─ Persiste Receipt + ReceiptItems
  └─ Retorna HTTP 200/409/400

Banco de dados recebe:
  ├─ 1 registro em MARKETS (novo ou existente)
  ├─ 1 registro em RECEIPTS
  └─ N registros em RECEIPT_ITEMS
```

---

## 📝 Padrões de Nomenclatura Rápido

### Entities
```java
// Singular, PascalCase
Market, Category, Product, Receipt, ReceiptItem
```

### Repositories
```java
// {Entity}Repository
MarketRepository, ReceiptRepository, ProductRepository
```

### Services
```java
// {Entity}Service
MarketService, ReceiptService, ProductService
// ou {Feature}Service
ReceiptImportService, PriceAnalysisService
```

### Controllers
```java
// {Entity}Controller
ReceiptController, ProductController
// ou {Feature}Controller
ReceiptImportController
```

### DTOs
```java
// Request: {Action}{Entity}Request
CreateReceiptRequest, ImportReceiptRequest
// Response: {Entity}Response ou {Entity}DTO
ReceiptDTO, ProductResponse
```

### Métodos Find/Get
```java
// Queries (sempre legíveis)
findByMarketId()
findByMarketIdAndPurchaseDateBetween()
getByIdOrThrow()
findTopNByOrderByPriceDesc()
```

---

## 🔐 Status HTTP Comuns

| Código | Nome | Quando Usar |
|--------|------|------------|
| **200** | OK | Requisição bem-sucedida |
| **201** | Created | Recurso criado com sucesso |
| **400** | Bad Request | Entrada inválida do cliente |
| **404** | Not Found | Recurso não encontrado |
| **409** | Conflict | Duplicata (ex: access_key já existe) |
| **500** | Internal Server Error | Erro interno do servidor |

---

## 🗓️ Estados das Features

| Estado | Símbolo | Significado |
|--------|---------|------------|
| Concluída | ✅ | Feature implementada e testada |
| Em Progresso | 🔄 | Sendo desenvolvida |
| Planejada | ⏳ | Agendada para fazer |
| Bloqueada | 🚫 | Aguardando outra feature |
| Depreciada | ⚠️ | Não deve ser usada |

---

## 📊 Exemplo de Query

```sql
-- Encontrar o preço médio de um produto por mês
SELECT 
    YEAR(r.purchase_date) AS year,
    MONTH(r.purchase_date) AS month,
    AVG(ri.unit_price) AS avg_price,
    MIN(ri.unit_price) AS min_price,
    MAX(ri.unit_price) AS max_price
FROM receipt_items ri
JOIN receipts r ON ri.receipt_id = r.id
JOIN products_master p ON ri.product_id = p.id
WHERE p.id = 123
GROUP BY YEAR(r.purchase_date), MONTH(r.purchase_date)
ORDER BY year DESC, month DESC;
```

---

## 🎓 Recursos de Aprendizado Recomendados

- Spring Framework Documentation: https://spring.io/
- JPA & Hibernate: https://hibernate.org/orm/documentation/
- MySQL Documentation: https://dev.mysql.com/doc/
- RESTful API Best Practices: https://restfulapi.net/

---

*Glossário versão: v1.0*  
*Atualizado: Julho 2026*
