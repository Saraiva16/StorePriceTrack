package com.storepricetrack.store_price_track.modules.receipts.ai;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.List;

@Component
public class GoogleAiReceiptExtractionClient implements ReceiptExtractionClient {

    private static final Logger log = LoggerFactory.getLogger(GoogleAiReceiptExtractionClient.class);

    private static final String PROMPT = """
            Você é um sistema de extração de dados de cupons fiscais brasileiros.
            Analise a imagem da nota fiscal e responda APENAS com um JSON no formato exato abaixo,
            sem markdown e sem texto adicional. Use null para campos não visíveis na imagem.
            {
              "market_name": string,
              "cnpj": string,
              "address": string,
              "city_uf": string,
              "purchase_date": string (ISO-8601, ex: 2026-07-20T14:30:00 ou 2026-07-20),
              "total_amount": number,
              "access_key": string (44 dígitos, chave de acesso da NF-e),
            "items": [
              { 
                "name": string (Traduza e expanda as abreviações do cupom para um formato claro e amigável. Ex: de 'LT INT BAT' para 'Leite Integral Batavo'), 
                "category": string (Escolha apenas uma: Açougue, Laticínios e Ovos, Padaria, Hortifruti, Mercearia, Bebidas, Limpeza, Higiene, Congelados, Doces e Snacks, Outros),
                "quantity": number, 
                "unit_price": number, 
                "total_price": number 
              }
            ]
          }
            """;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String model;

    public GoogleAiReceiptExtractionClient(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${google.ai.base-url}") String baseUrl,
            @Value("${google.ai.api-key}") String apiKey,
            @Value("${google.ai.model}") String model) {
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.objectMapper = objectMapper;
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public ReceiptExtractionResult extract(byte[] imageBytes, String mimeType) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ReceiptExtractionException(
                    "Google AI API key não configurada. Defina a variável de ambiente GOOGLE_AI_API_KEY");
        }

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        GeminiPart textPart = new GeminiPart(PROMPT, null);
        GeminiPart imagePart = new GeminiPart(null, new GeminiInlineData(mimeType, base64Image));
        GeminiRequest request = new GeminiRequest(
                List.of(new GeminiContent(List.of(textPart, imagePart))),
                new GeminiGenerationConfig("application/json"));

        GeminiResponse response;
        try {
            response = callApi(request, this.model);
        } catch (org.springframework.web.client.RestClientResponseException e) {
            if (e.getStatusCode().value() == 503) {
                log.warn("Model {} is unavailable (503). Attempting fallback to gemini-pro-latest...", this.model);
                try {
                    response = callApi(request, "gemini-pro-latest");
                } catch (Exception ex) {
                    throw new ReceiptExtractionException("Ambos os modelos da IA estão indisponíveis no momento (503). O Google AI Studio está sobrecarregado.", ex);
                }
            } else {
                log.error("Google AI returned HTTP {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
                throw new ReceiptExtractionException("Erro na IA do Google (" + e.getStatusCode().value() + "): " + e.getResponseBodyAsString(), e);
            }
        } catch (Exception e) {
            log.error("Erro inesperado na IA: ", e);
            throw new ReceiptExtractionException("Erro de comunicação com a IA: " + e.getMessage(), e);
        }

        String json = extractText(response);
        return parse(json);
    }

    private GeminiResponse callApi(GeminiRequest request, String targetModel) {
        return restClient.post()
                .uri("/v1beta/models/{model}:generateContent?key={apiKey}", targetModel, apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(GeminiResponse.class);
    }

    private String extractText(GeminiResponse response) {
        if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
            throw new ReceiptExtractionException("Google AI Studio não retornou nenhum candidato para a imagem enviada");
        }
        GeminiContent content = response.candidates().get(0).content();
        if (content == null || content.parts() == null || content.parts().isEmpty()) {
            throw new ReceiptExtractionException("Resposta do Google AI Studio veio sem conteúdo de texto");
        }
        return content.parts().get(0).text();
    }

    private ReceiptExtractionResult parse(String json) {
        try {
            return objectMapper.readValue(json, ReceiptExtractionResult.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse Google AI response as ReceiptExtractionResult: {}", json, e);
            throw new ReceiptExtractionException("Não foi possível interpretar o JSON retornado pela IA para o recibo", e);
        }
    }

    private record GeminiRequest(
            List<GeminiContent> contents,
            @JsonProperty("generationConfig") GeminiGenerationConfig generationConfig) {
    }

    private record GeminiContent(List<GeminiPart> parts) {
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private record GeminiPart(String text, @JsonProperty("inlineData") GeminiInlineData inlineData) {
    }

    private record GeminiInlineData(@JsonProperty("mimeType") String mimeType, String data) {
    }

    private record GeminiGenerationConfig(@JsonProperty("responseMimeType") String responseMimeType) {
    }

    private record GeminiResponse(List<GeminiCandidate> candidates) {
    }

    private record GeminiCandidate(GeminiContent content) {
    }
}
