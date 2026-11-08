package com.storepricetrack.store_price_track.modules.receipts.parser;

import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionException;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult;
import com.storepricetrack.store_price_track.modules.receipts.ai.ReceiptExtractionResult.ReceiptExtractionItem;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SpNfceParser implements INfceParser {

    private static final Logger log = LoggerFactory.getLogger(SpNfceParser.class);

    private static final String USER_AGENT = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) "
            + "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";

    private static final Pattern CNPJ_PATTERN = Pattern.compile("(\\d{2}\\.\\d{3}\\.\\d{3}/\\d{4}-\\d{2})");
    private static final Pattern NUMERIC_PATTERN = Pattern.compile("([0-9]+(?:[\\.,][0-9]+)*)");
    private static final Pattern EMISSION_DATE_PATTERN = Pattern.compile("(\\d{2}/\\d{2}/\\d{4}\\s+\\d{2}:\\d{2}:\\d{2})");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");

    @Override
    public String getSupportedUf() {
        return "SP";
    }

    @Override
    public boolean supports(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.contains("fazenda.sp.gov.br") || lower.contains(".sp.gov.br");
    }

    @Override
    public ReceiptExtractionResult parse(String url) {
        try {
            log.info("Downloading and parsing NFC-e from SEFAZ SP: {}", url);
            Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
                    .header("Accept-Language", "pt-BR,pt;q=0.9")
                    .timeout(15000)
                    .get();

            return parseDocument(doc, url);
        } catch (IOException e) {
            log.error("Failed to connect to SEFAZ SP URL: {}", url, e);
            throw new ReceiptExtractionException("Falha ao consultar a nota fiscal no portal da Fazenda de SP: " + e.getMessage(), e);
        }
    }

    @Override
    public ReceiptExtractionResult parseHtml(String html, String sourceUrl) {
        Document doc = Jsoup.parse(html);
        return parseDocument(doc, sourceUrl);
    }

    private ReceiptExtractionResult parseDocument(Document doc, String sourceUrl) {
        // Validação básica se houve bloqueio WAF ou página de erro
        String title = doc.title();
        if (title != null && title.toLowerCase().contains("request rejected")) {
            throw new ReceiptExtractionException("Acesso temporariamente bloqueado pelo portal da SEFAZ SP.");
        }

        // 1. Dados do Estabelecimento
        String marketName = "";
        Element topoElement = doc.selectFirst("#u20, .txtTopo");
        if (topoElement != null) {
            marketName = topoElement.text().trim();
        }

        String cnpj = "";
        String address = "";
        String cityUf = "SP";

        Elements textElements = doc.select(".txtCenter .text");
        for (Element textEl : textElements) {
            String txt = textEl.text().trim();
            Matcher cnpjMatcher = CNPJ_PATTERN.matcher(txt);
            if (cnpjMatcher.find()) {
                cnpj = cnpjMatcher.group(1);
            } else if (!txt.isEmpty()) {
                address = txt.replaceAll("\\s*,\\s*", ", ");
                if (address.endsWith("SP")) {
                    cityUf = "SP";
                }
            }
        }

        // 2. Itens
        List<ReceiptExtractionItem> items = new ArrayList<>();
        Elements itemRows = doc.select("#tabResult tr");
        for (Element row : itemRows) {
            Element nameEl = row.selectFirst(".txtTit");
            if (nameEl == null) continue;
            String itemName = nameEl.text().trim();

            BigDecimal qty = BigDecimal.ONE;
            Element qtyEl = row.selectFirst(".Rqtd");
            if (qtyEl != null) {
                qty = parseBigDecimal(qtyEl.text());
            }

            String unitMeasure = "un";
            Element unitEl = row.selectFirst(".RUN");
            if (unitEl != null) {
                String uText = unitEl.text().replaceAll("(?i)UN\\s*:\\s*", "").trim().toLowerCase();
                if (!uText.isBlank()) {
                    unitMeasure = uText;
                }
            }

            BigDecimal unitPrice = BigDecimal.ZERO;
            Element unitPriceEl = row.selectFirst(".RvlUnit");
            if (unitPriceEl != null) {
                unitPrice = parseBigDecimal(unitPriceEl.text());
            }

            BigDecimal totalPrice = BigDecimal.ZERO;
            Element totalEl = row.selectFirst(".valor");
            if (totalEl != null) {
                totalPrice = parseBigDecimal(totalEl.text());
            } else if (qty.compareTo(BigDecimal.ZERO) > 0 && unitPrice.compareTo(BigDecimal.ZERO) > 0) {
                totalPrice = qty.multiply(unitPrice);
            }

            if (!itemName.isBlank()) {
                items.add(new ReceiptExtractionItem(itemName, null, unitMeasure, qty, unitPrice, totalPrice));
            }
        }

        // 3. Valor Total da Nota
        BigDecimal totalAmount = BigDecimal.ZERO;
        Element totalNotaEl = doc.selectFirst(".linhaShade .totalNumb, #totalNota .txtMax");
        if (totalNotaEl != null) {
            totalAmount = parseBigDecimal(totalNotaEl.text());
        } else {
            // Soma dos itens como fallback
            totalAmount = items.stream()
                    .map(ReceiptExtractionItem::totalPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // 4. Data de Emissão
        String purchaseDateIso = null;
        Elements liGeneralInfo = doc.select("#infos ul.jqm-listview li");
        for (Element li : liGeneralInfo) {
            String liText = li.text();
            Matcher dateMatcher = EMISSION_DATE_PATTERN.matcher(liText);
            if (dateMatcher.find()) {
                try {
                    LocalDateTime dt = LocalDateTime.parse(dateMatcher.group(1), DATE_FORMATTER);
                    purchaseDateIso = dt.toString();
                    break;
                } catch (Exception e) {
                    log.warn("Could not parse date string: {}", dateMatcher.group(1));
                }
            }
        }
        if (purchaseDateIso == null) {
            purchaseDateIso = LocalDateTime.now().toString();
        }

        // 5. Chave de Acesso
        String accessKey = null;
        Element chaveEl = doc.selectFirst("span.chave");
        if (chaveEl != null) {
            accessKey = chaveEl.text().replaceAll("\\s+", "").trim();
        } else if (sourceUrl != null && sourceUrl.contains("p=")) {
            // Tenta extrair a chave de 44 dígitos da URL
            Pattern keyPattern = Pattern.compile("p=([0-9]{44})");
            Matcher m = keyPattern.matcher(sourceUrl);
            if (m.find()) {
                accessKey = m.group(1);
            }
        }

        log.info("Parsed NFC-e from SP: market='{}', cnpj='{}', total={}, items={}",
                marketName, cnpj, totalAmount, items.size());

        return new ReceiptExtractionResult(
                marketName,
                cnpj,
                address,
                cityUf,
                purchaseDateIso,
                totalAmount,
                accessKey,
                items
        );
    }

    private BigDecimal parseBigDecimal(String raw) {
        if (raw == null || raw.isBlank()) return BigDecimal.ZERO;
        Matcher m = NUMERIC_PATTERN.matcher(raw);
        if (m.find()) {
            try {
                String numStr = m.group(1);
                if (numStr.contains(",")) {
                    numStr = numStr.replace(".", "").replace(",", ".");
                }
                return new BigDecimal(numStr);
            } catch (Exception ignored) {
            }
        }
        return BigDecimal.ZERO;
    }
}
