package com.storepricetrack.store_price_track.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI storePriceTrackOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Store Price Track API")
                        .description("Digitaliza, processa e analisa recibos de compras em supermercados: "
                                + "importação via Google AI Studio, histórico de preços por produto/mercado, "
                                + "e relatórios de tendência e melhor dia para comprar.")
                        .version("v1"));
    }
}
