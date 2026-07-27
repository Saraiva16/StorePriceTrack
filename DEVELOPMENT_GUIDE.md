# Store Price Track — Guia de Desenvolvimento Rápido

> Referência ágil para decisões e padrões durante a implementação

---

## 🎯 Checklist: Ao Criar um Novo Serviço

```
[ ] Criar interface {Feature}Service em modules/{modulo}/service/
[ ] Implementar classe {Feature}ServiceImpl
[ ] Usar @Service e @Transactional quando apropriado
[ ] Injetar repositories via @Autowired
[ ] Adicionar logger: private static final Logger log = LoggerFactory.getLogger(...)
[ ] Implementar tratamento de exceções (EntityNotFoundException, etc.)
[ ] Criar testes unitários básicos
[ ] Documentar métodos públicos com Javadoc
[ ] Usar nomes de método descritivos (getBy*, findBy*, calculateBy*, etc.)
```

## 🎯 Checklist: Ao Criar um Novo Controller

```
[ ] Criar classe {Feature}Controller com @RestController
[ ] Definir @RequestMapping("/api/{feature}")
[ ] Usar métodos HTTP corretos (GET, POST, PUT, DELETE)
[ ] Validar input com @Valid se houver DTOs
[ ] Retornar status HTTP apropriados (200, 201, 400, 404, 409)
[ ] Adicionar logs de entrada/saída
[ ] Implementar tratamento global de exceções (ExceptionHandler)
[ ] Documentar endpoints com comentários ou Swagger
[ ] Usar DTOs para requisição e resposta (nunca entities diretamente)
```

## 🎯 Checklist: Ao Criar um Novo Entity

```
[ ] Usar @Entity e @Table(name="...")
[ ] PK: @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
[ ] Usar BIGINT para PKs (@Column(columnDefinition = "BIGINT"))
[ ] Adicionar @Temporal para datas
[ ] Usar Lombok: @Getter, @Setter, @NoArgsConstructor
[ ] Criar relacionamentos com @OneToMany, @ManyToOne, etc.
[ ] Adicionar índices se necessário (@Index)
[ ] Validar constraints com @NotNull, @Size, etc.
[ ] Implementar toString() apenas para campos essenciais
[ ] Evitar relações circulares (use @JsonBackReference se necessário)
```

---

## 📋 Tabela de Referência Rápida: Endpoints Esperados

### Fase 2 (Concluída)

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| POST | `/api/receipts/import` | Importar novo recibo | ✅ DONE |
| GET | `/api/receipts/{id}` | Detalhe de um recibo | ✅ DONE |
| GET | `/api/receipts/market/{marketId}` | Recibos por mercado | ✅ DONE |
| GET | `/api/receipts/period?start=&end=` | Recibos por período | ✅ DONE |
| GET | `/api/receipts/recent?months=` | Histórico recente (N meses) | ✅ DONE |
| GET | `/api/receipt-items/product/{productId}` | Itens por produto | ✅ DONE |
| GET | `/api/receipt-items/product/{productId}/price-stats` | Min/média/máx de preço | ✅ DONE |
| GET | `/api/receipt-items/top-products?limit=` | Top produtos mais comprados | ✅ DONE |

### Fase 3 (Concluída)

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| GET | `/api/products?name=` | Listar/buscar produtos | ✅ DONE |
| GET | `/api/products/{id}` | Detalhe de um produto | ✅ DONE |
| POST | `/api/products` | Criar produto | ✅ DONE |
| PUT | `/api/products/{id}` | Atualizar categoria do produto | ✅ DONE |
| GET | `/api/categories` | Listar categorias | ✅ DONE |
| GET | `/api/categories/{id}` | Detalhe de uma categoria | ✅ DONE |
| POST | `/api/categories` | Criar categoria | ✅ DONE |
| PUT | `/api/categories/{id}` | Atualizar categoria | ✅ DONE |
| DELETE | `/api/categories/{id}` | Remover categoria | ✅ DONE |
| — | Normalização automática (import) | Match exato de alta confiança: mapeia nome bruto do recibo → produto já visto | ✅ DONE |
| — | Detecção de produtos duplicados / sugestão de agrupamento | Ferramenta de qualidade de dados, escopo separado | ⏳ TODO |

### Fase 4 (Concluída)

| Método | Endpoint | Descrição | Status |
|--------|----------|-----------|--------|
| GET | `/api/reports/price-trends?productId=` | Tendência de preço por mês | ✅ DONE |
| GET | `/api/reports/market-comparison?productId=` | Comparação entre mercados | ✅ DONE |
| GET | `/api/reports/products/cheapest?limit=` | Produtos mais baratos | ✅ DONE |
| GET | `/api/reports/products/most-expensive?limit=` | Produtos mais caros | ✅ DONE |
| GET | `/api/reports/best-shopping-days` | Melhor dia da semana (desvio % da média do produto) | ✅ DONE |
| GET | `/api/reports/purchase-pattern` | Frequência de compra por dia da semana | ✅ DONE |

---

## 🔌 Padrão de Implementação de Serviço

```java
package com.storepricetrack.store_price_track.modules.myfeature.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class MyFeatureService {

    private static final Logger log = LoggerFactory.getLogger(MyFeatureService.class);

    @Autowired
    private MyRepository repository;

    // Queries (read-only)
    @Transactional(readOnly = true)
    public List<MyEntity> findAll() {
        log.debug("Fetching all MyEntity");
        return repository.findAll();
    }

    // Commands (write)
    public MyEntity create(CreateRequest request) {
        log.info("Creating MyEntity: {}", request);
        MyEntity entity = new MyEntity();
        // ... mapear request para entity ...
        MyEntity saved = repository.save(entity);
        log.info("MyEntity created with id: {}", saved.getId());
        return saved;
    }

    // Error handling
    public MyEntity getById(Long id) {
        log.debug("Fetching MyEntity by id: {}", id);
        return repository.findById(id)
            .orElseThrow(() -> {
                log.warn("MyEntity not found with id: {}", id);
                return new EntityNotFoundException("MyEntity", "id", id.toString());
            });
    }
}
```

## 🔌 Padrão de Implementação de Controller

```java
package com.storepricetrack.store_price_track.modules.myfeature.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/my-feature")
public class MyFeatureController {

    private static final Logger log = LoggerFactory.getLogger(MyFeatureController.class);

    @Autowired
    private MyFeatureService service;

    @GetMapping
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) String filter) {
        log.info("GET /api/my-feature - filter: {}", filter);
        List<MyDTO> result = service.findAll();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        log.info("GET /api/my-feature/{}", id);
        MyDTO result = service.getById(id);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody CreateRequest request) {
        log.info("POST /api/my-feature - request: {}", request);
        MyDTO created = service.create(request);
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(created);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> handleNotFound(EntityNotFoundException ex) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity
            .status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", ex.getMessage()));
    }
}
```

---

## 💡 Decisões de Design Comuns

### Quando usar Query Methods vs Custom Queries?

**Query Methods (Simples):**
```java
// Use quando é só um WHERE simples
List<Receipt> findByMarketId(Long marketId);
List<Receipt> findByMarketIdAndPurchaseDateBetween(Long marketId, LocalDate start, LocalDate end);
```

**@Query (Complexo):**
```java
// Use quando precisa de JOINs, GROUP BY, agregações
@Query("""
    SELECT r FROM Receipt r
    WHERE r.market.id = :marketId
    AND r.purchaseDate BETWEEN :start AND :end
    ORDER BY r.purchaseDate DESC
""")
List<Receipt> findReceiptsByMarketAndPeriod(
    @Param("marketId") Long marketId,
    @Param("start") LocalDate start,
    @Param("end") LocalDate end);
```

### Transações: Quando usar @Transactional(readOnly = true)?

```java
// Sempre use em queries
@Transactional(readOnly = true)
public List<Receipt> findAll() { ... }

// Não precisa em creates/updates (padrão já é transacional)
public Receipt create(CreateRequest req) { ... }

// Mas coloque no serviço inteiro se tudo é read-only
@Service
@Transactional(readOnly = true)
public class ReportsService { ... }
```

### DTOs: Quando mapear?

```java
// SEMPRE use DTOs em Controllers (nunca retorne entities diretamente)
@GetMapping("/{id}")
public ResponseEntity<ReceiptDTO> getReceipt(@PathVariable Long id) {
    Receipt entity = service.getReceipt(id);
    ReceiptDTO dto = new ReceiptDTO(entity);  // ← mapear aqui
    return ResponseEntity.ok(dto);
}
```

---

## 🧪 Exemplo: Implementando ReceiptsService

### 1️⃣ Interface
```java
public interface IReceiptsService {
    List<ReceiptDTO> findByMarket(Long marketId);
    List<ReceiptDTO> findByPeriod(LocalDate start, LocalDate end);
    ReceiptDTO getById(Long id);
    List<ReceiptDTO> getRecent(int days);
}
```

### 2️⃣ Repository
```java
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    List<Receipt> findByMarketId(Long marketId);
    List<Receipt> findByPurchaseDateBetween(LocalDate start, LocalDate end);
}
```

### 3️⃣ Service
```java
@Service
@Transactional
public class ReceiptsService implements IReceiptsService {
    
    @Autowired
    private ReceiptRepository repository;
    
    @Override
    @Transactional(readOnly = true)
    public List<ReceiptDTO> findByMarket(Long marketId) {
        return repository.findByMarketId(marketId)
            .stream()
            .map(ReceiptDTO::new)
            .toList();
    }
    
    // ... outros métodos
}
```

### 4️⃣ Controller
```java
@RestController
@RequestMapping("/api/receipts")
public class ReceiptsController {
    
    @Autowired
    private ReceiptsService service;
    
    @GetMapping("/market/{marketId}")
    public ResponseEntity<List<ReceiptDTO>> getByMarket(@PathVariable Long marketId) {
        return ResponseEntity.ok(service.findByMarket(marketId));
    }
}
```

---

## 🔍 Troubleshooting Comum

### Erro: "no matching constructor found" no Entity

```java
// ❌ ERRADO
@Entity
public class MyEntity {
    // Nenhum construtor
}

// ✅ CORRETO (com Lombok)
@Entity
@NoArgsConstructor
public class MyEntity { ... }

// ✅ CORRETO (manual)
public class MyEntity {
    public MyEntity() {}  // No-args constructor é obrigatório em JPA
}
```

### Erro: "Duplicate entry" na inserção

**Causa:** Violação de constraint UNIQUE (provavelmente `access_key`)

```java
// Sempre verificar duplicata antes de inserir
if (repository.existsByAccessKey(accessKey)) {
    throw new DuplicateReceiptException("Recibo já foi importado");
}
```

### Erro: "lazy initialization exception"

```java
// ❌ Lazy loading fora da transação
receipt.getItems();  // Falha se session fechou

// ✅ Soluções:
// 1. Usar @Transactional na query
@Transactional(readOnly = true)
public Receipt getWithItems(Long id) {
    return repository.findById(id).orElse(null);
}

// 2. Usar JOIN FETCH
@Query("SELECT r FROM Receipt r JOIN FETCH r.items WHERE r.id = :id")
Receipt findByIdWithItems(@Param("id") Long id);
```

### Erro: Jackson não consegue desserializar

```
// ❌ Erro: "unknown property 'market_name'"

// ✅ Verificar application.properties
spring.jackson.property-naming-strategy=SNAKE_CASE

// ✅ Ou usar @JsonProperty em cada campo
public class ReceiptImportDTO {
    @JsonProperty("market_name")
    private String marketName;
}
```

---

## 📊 Diagrama: Fluxo Típico de Uma Feature

```
1. Requisito → Design → Code
2. Entity → Repository → Service → Controller → DTO
3. Test → Review → Merge → Deploy

Por exemplo, para "Listar recibos por mercado":
├─ Entity (Receipt com @ManyToOne Market) ✅ existe
├─ Repository (findByMarketId) → criar
├─ Service (findByMarket) → criar
├─ DTO (ReceiptDTO) → criar se não existir
├─ Controller (GET /api/receipts/market/{id}) → criar
├─ Teste de integração → criar
└─ Merge para main
```

---

## 🎓 Links de Referência

- **Spring Boot Docs**: https://spring.io/projects/spring-boot
- **Spring Data JPA**: https://spring.io/projects/spring-data-jpa
- **Hibernate Docs**: https://hibernate.org/
- **Jackson**: https://github.com/FasterXML/jackson
- **Lombok**: https://projectlombok.org/

---

## ✅ Antes de Fazer Commit

```bash
# 1. Executar testes
mvn test

# 2. Verificar formatação
mvn spotless:apply

# 3. Atualizar documentação
# editar este arquivo se necessário

# 4. Verificar se não quebrou nada
mvn clean install

# 5. Fazer commit com mensagem clara
git commit -m "feat: add ReceiptsService for querying receipts by market"
```

---

*Atualizado: Julho 2026*
