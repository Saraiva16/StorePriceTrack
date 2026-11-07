package com.storepricetrack.store_price_track.modules.receipts.service;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class NfceItemNormalizerService {

    private static final Map<String, String> ABBREVIATIONS = new LinkedHashMap<>();
    private static final Set<String> COMMON_BRANDS = new LinkedHashSet<>();
    private static final List<String> TECHNICAL_TAGS = List.of(
            "CAIS", "CXA", "CX", "BDG", "BDJ", "MACO", "MC", "DZ", "DUZIA", "CT"
    );

    static {
        // --- Abreviações compostas (maior precedência) ---
        ABBREVIATIONS.put("\\bL\\s+VIDA\\b", "LONGA VIDA");
        ABBREVIATIONS.put("\\bL\\.VIDA\\b", "LONGA VIDA");
        ABBREVIATIONS.put("\\bZ\\s+L\\b", "1L");
        ABBREVIATIONS.put("\\bZ\\s*L\\b", "1L");

        // --- 1. HORTIFRÚTI / FRUTAS, LEGUMES E VERDURAS (FLV) ---
        // Verduras e Folhas
        ABBREVIATIONS.put("\\bALFAC\\b", "ALFACE");
        ABBREVIATIONS.put("\\bALF\\b", "ALFACE");
        ABBREVIATIONS.put("\\bAMER\\b", "AMERICANA");
        ABBREVIATIONS.put("\\bAMERIC\\b", "AMERICANA");
        ABBREVIATIONS.put("\\bCRES\\b", "CRESPA");
        ABBREVIATIONS.put("\\bCRESP\\b", "CRESPA");
        ABBREVIATIONS.put("\\bROX\\b", "ROXA");
        ABBREVIATIONS.put("\\bROMAN\\b", "ROMANA");
        ABBREVIATIONS.put("\\bCOUV\\b", "COUVE");
        ABBREVIATIONS.put("\\bMANTEIG\\b", "MANTEIGA");
        ABBREVIATIONS.put("\\bESPIN\\b", "ESPINAFRE");
        ABBREVIATIONS.put("\\bESPINAFR\\b", "ESPINAFRE");
        ABBREVIATIONS.put("\\bAGRIA\\b", "AGRIAO");
        ABBREVIATIONS.put("\\bRUCUL\\b", "RUCULA");
        ABBREVIATIONS.put("\\bREPO\\b", "REPOLHO");
        ABBREVIATIONS.put("\\bREPOLH\\b", "REPOLHO");
        ABBREVIATIONS.put("\\bBROC\\b", "BROCOLIS");
        ABBREVIATIONS.put("\\bBROCOL\\b", "BROCOLIS");

        // Legumes e Tubérculos
        ABBREVIATIONS.put("\\bTOM\\b", "TOMATE");
        ABBREVIATIONS.put("\\bTOMAT\\b", "TOMATE");
        ABBREVIATIONS.put("\\bCEB\\b", "CEBOLA");
        ABBREVIATIONS.put("\\bCEBOL\\b", "CEBOLA");
        ABBREVIATIONS.put("\\bBAT\\b", "BATATA");
        ABBREVIATIONS.put("\\bBATAT\\b", "BATATA");
        ABBREVIATIONS.put("\\bINGL\\b", "INGLESA");
        ABBREVIATIONS.put("\\bINGLES\\b", "INGLESA");
        ABBREVIATIONS.put("\\bCEN\\b", "CENOURA");
        ABBREVIATIONS.put("\\bCENOUR\\b", "CENOURA");
        ABBREVIATIONS.put("\\bALH\\b", "ALHO");
        ABBREVIATIONS.put("\\bBETERR\\b", "BETERRABA");
        ABBREVIATIONS.put("\\bPEP\\b", "PEPINO");
        ABBREVIATIONS.put("\\bPEPIN\\b", "PEPINO");
        ABBREVIATIONS.put("\\bJAP\\b", "JAPONES");
        ABBREVIATIONS.put("\\bJAPON\\b", "JAPONES");
        ABBREVIATIONS.put("\\bABOB\\b", "ABOBORA");
        ABBREVIATIONS.put("\\bABOBOR\\b", "ABOBORA");
        ABBREVIATIONS.put("\\bABOBRINH\\b", "ABOBRINHA");
        ABBREVIATIONS.put("\\bCHUCH\\b", "CHUCHU");
        ABBREVIATIONS.put("\\bPIM\\b", "PIMENTAO");
        ABBREVIATIONS.put("\\bPIMENT\\b", "PIMENTAO");
        ABBREVIATIONS.put("\\bMAND\\b", "MANDIOCA");
        ABBREVIATIONS.put("\\bMANDIOC\\b", "MANDIOCA");
        ABBREVIATIONS.put("\\bMANDIOQ\\b", "MANDIOQUINHA");
        ABBREVIATIONS.put("\\bBERINJ\\b", "BERINJELA");
        ABBREVIATIONS.put("\\bQUIAB\\b", "QUIABO");
        ABBREVIATIONS.put("\\bMILH\\b", "MILHO");

        // Frutas
        ABBREVIATIONS.put("\\bBAN\\b", "BANANA");
        ABBREVIATIONS.put("\\bBANAN\\b", "BANANA");
        ABBREVIATIONS.put("\\bPRAT\\b", "PRATA");
        ABBREVIATIONS.put("\\bNANIC\\b", "NANICA");
        ABBREVIATIONS.put("\\bMAC\\b", "MACARRAO"); // 'MAC' padrão em supermercados refere-se a macarrão (ex: MAC.ARROZ)
        ABBREVIATIONS.put("\\bFUJ\\b", "FUJI");
        ABBREVIATIONS.put("\\bLAR\\b", "LARANJA");
        ABBREVIATIONS.put("\\bLARANJ\\b", "LARANJA");
        ABBREVIATIONS.put("\\bLIM\\b", "LIMAO");
        ABBREVIATIONS.put("\\bTAHIT\\b", "TAITI");
        ABBREVIATIONS.put("\\bTAITI\\b", "TAITI");
        ABBREVIATIONS.put("\\bMAM\\b", "MAMAO");
        ABBREVIATIONS.put("\\bPAPAY\\b", "PAPAYA");
        ABBREVIATIONS.put("\\bFORMOS\\b", "FORMOSA");
        ABBREVIATIONS.put("\\bMEL\\b", "MELANCIA");
        ABBREVIATIONS.put("\\bMELANC\\b", "MELANCIA");
        ABBREVIATIONS.put("\\bMELAO\\b", "MELAO");
        ABBREVIATIONS.put("\\bABAC\\b", "ABACAXI");
        ABBREVIATIONS.put("\\bABACAX\\b", "ABACAXI");
        ABBREVIATIONS.put("\\bPEROL\\b", "PEROLA");
        ABBREVIATIONS.put("\\bMORANG\\b", "MORANGO");
        ABBREVIATIONS.put("\\bPESC\\b", "PESSEGO");
        ABBREVIATIONS.put("\\bUVA\\b", "UVA");
        ABBREVIATIONS.put("\\bPERA\\b", "PERA");
        ABBREVIATIONS.put("\\bMARAC\\b", "MARACUJA");
        ABBREVIATIONS.put("\\bMARACUJ\\b", "MARACUJA");
        ABBREVIATIONS.put("\\bABACAT\\b", "ABACATE");

        // --- 2. LATICÍNIOS, PADARIA E MATINAIS ---
        ABBREVIATIONS.put("\\bL\\b", "LEITE");
        ABBREVIATIONS.put("\\bLT\\b", "LEITE");
        ABBREVIATIONS.put("\\bLTE\\b", "LEITE");
        ABBREVIATIONS.put("\\bCOND\\b", "CONDENSADO");
        ABBREVIATIONS.put("\\bCONDENS\\b", "CONDENSADO");
        ABBREVIATIONS.put("\\bDESN\\b", "DESNATADO");
        ABBREVIATIONS.put("\\bSEMIDESN\\b", "SEMIDESNATADO");
        ABBREVIATIONS.put("\\bINTEG\\b", "INTEGRAL");
        ABBREVIATIONS.put("\\bINT\\b", "INTEGRAL");
        ABBREVIATIONS.put("\\bIQ\\b", "IOGURTE");
        ABBREVIATIONS.put("\\bIOG\\b", "IOGURTE");
        ABBREVIATIONS.put("\\bREQ\\b", "REQUEIJAO");
        ABBREVIATIONS.put("\\bREQUEIJ\\b", "REQUEIJAO");
        ABBREVIATIONS.put("\\bCHOC\\b", "CHOCOLATE");
        ABBREVIATIONS.put("\\bCHOCOL\\b", "CHOCOLATE");
        ABBREVIATIONS.put("\\bACHOC\\b", "ACHOCOLATADO");
        ABBREVIATIONS.put("\\bCAFE\\b", "CAFE");
        ABBREVIATIONS.put("\\bACUC\\b", "ACUCAR");
        ABBREVIATIONS.put("\\bACUCAR\\b", "ACUCAR");
        ABBREVIATIONS.put("\\bPAO\\b", "PAO");
        ABBREVIATIONS.put("\\bFRANC\\b", "FRANCES");
        ABBREVIATIONS.put("\\bTORR\\b", "TORRADA");
        ABBREVIATIONS.put("\\bBISC\\b", "BISCOITO");
        ABBREVIATIONS.put("\\bBOL\\b", "BOLACHA");
        ABBREVIATIONS.put("\\bMARG\\b", "MARGARINA");
        ABBREVIATIONS.put("\\bMARGAR\\b", "MARGARINA");

        // --- 3. MERCEARIA BÁSICA ---
        ABBREVIATIONS.put("\\bARR\\b", "ARROZ");
        ABBREVIATIONS.put("\\bFEIJ\\b", "FEIJAO");
        ABBREVIATIONS.put("\\bMACARR\\b", "MACARRAO");
        ABBREVIATIONS.put("\\bESPAG\\b", "ESPAGUETE");
        ABBREVIATIONS.put("\\bFAR\\b", "FARINHA");
        ABBREVIATIONS.put("\\bMOLH\\b", "MOLHO");
        ABBREVIATIONS.put("\\bEXTR\\b", "EXTRATO");
        ABBREVIATIONS.put("\\bMAION\\b", "MAIONESE");
        ABBREVIATIONS.put("\\bAZEIT\\b", "AZEITE");
        ABBREVIATIONS.put("\\bOLEO\\b", "OLEO");

        // --- 4. BEBIDAS ---
        ABBREVIATIONS.put("\\bREF\\b", "REFRIGERANTE");
        ABBREVIATIONS.put("\\bREFRIG\\b", "REFRIGERANTE");
        ABBREVIATIONS.put("\\bCERV\\b", "CERVEJA");
        ABBREVIATIONS.put("\\bAG\\b", "AGUA");
        ABBREVIATIONS.put("\\bSUC\\b", "SUCO");
        ABBREVIATIONS.put("\\bENER\\b", "ENERGETICO");
        ABBREVIATIONS.put("\\bVINH\\b", "VINHO");

        // --- 5. CARNES, AVES, PEIXES E FRIOS ---
        ABBREVIATIONS.put("\\bQJO\\b", "QUEIJO");
        ABBREVIATIONS.put("\\bQUEIJ\\b", "QUEIJO");
        ABBREVIATIONS.put("\\bMUSSA\\b", "MUSSARELA");
        ABBREVIATIONS.put("\\bMUSS\\b", "MUSSARELA");
        ABBREVIATIONS.put("\\bFT\\b", "FATIADO");
        ABBREVIATIONS.put("\\bCARN\\b", "CARNE");
        ABBREVIATIONS.put("\\bBOV\\b", "BOVINA");
        ABBREVIATIONS.put("\\bSUIN\\b", "SUINA");
        ABBREVIATIONS.put("\\bFRANG\\b", "FRANGO");
        ABBREVIATIONS.put("\\bPEIT\\b", "PEITO");
        ABBREVIATIONS.put("\\bCOX\\b", "COXA");
        ABBREVIATIONS.put("\\bSOBRECOX\\b", "SOBRECOXA");
        ABBREVIATIONS.put("\\bMOID\\b", "MOIDA");
        ABBREVIATIONS.put("\\bPATIN\\b", "PATINHO");
        ABBREVIATIONS.put("\\bALCAT\\b", "ALCATRA");
        ABBREVIATIONS.put("\\bPICANH\\b", "PICANHA");
        ABBREVIATIONS.put("\\bCOSTEL\\b", "COSTELA");
        ABBREVIATIONS.put("\\bLING\\b", "LINGUICA");
        ABBREVIATIONS.put("\\bLINGUIC\\b", "LINGUICA");
        ABBREVIATIONS.put("\\bCALAB\\b", "CALABRESA");
        ABBREVIATIONS.put("\\bCALABR\\b", "CALABRESA");
        ABBREVIATIONS.put("\\bSALS\\b", "SALSICHA");
        ABBREVIATIONS.put("\\bSALSICH\\b", "SALSICHA");
        ABBREVIATIONS.put("\\bPRES\\b", "PRESUNTO");
        ABBREVIATIONS.put("\\bPEIX\\b", "PEIXE");
        ABBREVIATIONS.put("\\bTILAP\\b", "TILAPIA");
        ABBREVIATIONS.put("\\bSALM\\b", "SALMAO");
        ABBREVIATIONS.put("\\bCAMAR\\b", "CAMARAO");

        // --- 6. LIMPEZA E HIGIENE ---
        ABBREVIATIONS.put("\\bSAB\\b", "SABONETE");
        ABBREVIATIONS.put("\\bSABON\\b", "SABONETE");
        ABBREVIATIONS.put("\\bDET\\b", "DETERGENTE");
        ABBREVIATIONS.put("\\bAMAC\\b", "AMACIANTE");
        ABBREVIATIONS.put("\\bDESINF\\b", "DESINFETANTE");
        ABBREVIATIONS.put("\\bDESOD\\b", "DESODORANTE");
        ABBREVIATIONS.put("\\bSHAMP\\b", "SHAMPOO");
        ABBREVIATIONS.put("\\bCONDIC\\b", "CONDICIONADOR");
        ABBREVIATIONS.put("\\bCREM\\s+DENT\\b", "CREME DENTAL");
        ABBREVIATIONS.put("\\bPAP\\s+HIG\\b", "PAPEL HIGIENICO");
        ABBREVIATIONS.put("\\bAG\\s+SANIT\\b", "AGUA SANITARIA");
        ABBREVIATIONS.put("\\bALV\\b", "ALVEJANTE");

        // --- 7. FORMATOS / EMBALAGENS ---
        ABBREVIATIONS.put("\\bPCT\\b", "PACOTE");
        ABBREVIATIONS.put("\\bCX\\b", "CAIXA");
        ABBREVIATIONS.put("\\bGF\\b", "GARRAFA");
        ABBREVIATIONS.put("\\bTP\\b", "TETRAPAK");

        // Marcas conhecidas para detecção
        COMMON_BRANDS.add("NESTLE");
        COMMON_BRANDS.add("MOCA");
        COMMON_BRANDS.add("PIRACANJUBA");
        COMMON_BRANDS.add("ITALAC");
        COMMON_BRANDS.add("CAMPONESA");
        COMMON_BRANDS.add("QUALY");
        COMMON_BRANDS.add("SADIA");
        COMMON_BRANDS.add("PERDIGAO");
        COMMON_BRANDS.add("SEARA");
        COMMON_BRANDS.add("AURORA");
        COMMON_BRANDS.add("URBANO");
        COMMON_BRANDS.add("VARIATTA");
        COMMON_BRANDS.add("COCA COLA");
        COMMON_BRANDS.add("COCA-COLA");
        COMMON_BRANDS.add("PEPSI");
        COMMON_BRANDS.add("HEINEKEN");
        COMMON_BRANDS.add("AMSTEL");
        COMMON_BRANDS.add("BRAHMA");
        COMMON_BRANDS.add("SKOL");
        COMMON_BRANDS.add("YOKI");
        COMMON_BRANDS.add("DONA BENTA");
        COMMON_BRANDS.add("CAMIL");
        COMMON_BRANDS.add("TIO JOAO");
        COMMON_BRANDS.add("PILAO");
        COMMON_BRANDS.add("MELITTA");
        COMMON_BRANDS.add("ORFEU");
        COMMON_BRANDS.add("TRES CORACOES");
        COMMON_BRANDS.add("OMO");
        COMMON_BRANDS.add("YPE");
        COMMON_BRANDS.add("COLGATE");
        COMMON_BRANDS.add("ORAL-B");
        COMMON_BRANDS.add("DOVE");
        COMMON_BRANDS.add("REXONA");
        COMMON_BRANDS.add("NIVEA");
    }

    public record NormalizedResult(String normalizedName, String brand, String unitMeasure) {}

    public NormalizedResult normalize(String rawName, String rawUnit) {
        if (rawName == null || rawName.isBlank()) {
            return new NormalizedResult("", null, resolveUnit(rawUnit));
        }

        String cleaned = rawName.toUpperCase().trim();

        // 1. Remove códigos fiscais numéricos comuns no início ou fim (ex: "7891234567890", "- 1234")
        cleaned = cleaned.replaceAll("^\\d{6,14}\\s+", "");
        cleaned = cleaned.replaceAll("\\s*-\\s*\\d+$", "");

        // 2. Transforma pontos, barras e traços não numéricos em espaços para separar tokens colados (ex: "MAC.ARROZ" -> "MAC ARROZ", "FR.QJO." -> "FR QJO ")
        cleaned = cleaned.replaceAll("(?<=\\D)[\\._\\/]+|[\\._\\/]+(?=\\D)", " ");

        // 3. Remove prefixos técnicos de departamento de supermercado no início do nome (ex: "FR ", "RF ", "HF ", "FLV ", "MER ")
        cleaned = cleaned.replaceAll("^(?:FR|RF|HF|FLV|MER|ACO|PAD)\\s+", "");

        // 4. Remove tags técnicas de classificação de Ceagesp / hortifrúti / embalagens técnicas (ex: "CAIS", "CXA", "BDG")
        for (String tag : TECHNICAL_TAGS) {
            cleaned = cleaned.replaceAll("(?i)\\b" + Pattern.quote(tag) + "\\b", " ");
        }

        // 5. Expande abreviações usando regex de fronteira de palavra
        for (Map.Entry<String, String> entry : ABBREVIATIONS.entrySet()) {
            cleaned = cleaned.replaceAll("(?i)" + entry.getKey(), entry.getValue());
        }

        // 6. Remove unidades avulsas sem número presas no final do nome (ex: "TOMATE ITALIANO KG" -> "TOMATE ITALIANO")
        cleaned = cleaned.replaceAll("(?i)\\s+\\b(KG|UN|UND|PC|PCA|PCT|PACOTE)\\b$", "");

        // 7. Normaliza espaçamentos e pontuações estranhas
        cleaned = cleaned.replaceAll("[_\\.]+", " ");
        cleaned = cleaned.replaceAll("\\s+", " ").trim();

        // 8. Detecção de Marca
        String detectedBrand = null;
        for (String brand : COMMON_BRANDS) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(brand) + "\\b", Pattern.CASE_INSENSITIVE);
            if (p.matcher(cleaned).find()) {
                detectedBrand = capitalize(brand);
                break;
            }
        }

        return new NormalizedResult(cleaned, detectedBrand, resolveUnit(rawUnit));
    }

    private String resolveUnit(String rawUnit) {
        if (rawUnit == null || rawUnit.isBlank()) return "un";
        String u = rawUnit.trim().toLowerCase();
        if (u.contains("kg") || u.contains("kilo")) return "kg";
        if (u.contains("g") && !u.contains("kg")) return "g";
        if (u.contains("l") || u.contains("lt")) return "l";
        if (u.contains("ml")) return "ml";
        return "un";
    }

    private String capitalize(String text) {
        if (text == null || text.isBlank()) return text;
        String[] parts = text.toLowerCase().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            if (!parts[i].isEmpty()) {
                sb.append(Character.toUpperCase(parts[i].charAt(0))).append(parts[i].substring(1));
                if (i < parts.length - 1) sb.append(" ");
            }
        }
        return sb.toString();
    }
}
