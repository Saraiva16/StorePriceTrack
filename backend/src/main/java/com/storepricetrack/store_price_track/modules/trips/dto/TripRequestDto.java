package com.storepricetrack.store_price_track.modules.trips.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TripRequestDto {

    @NotBlank(message = "O destino da viagem é obrigatório")
    private String destination;

    @NotNull(message = "A data de início é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonAlias({"start_date", "startDate"})
    private LocalDate startDate;

    @NotNull(message = "O horário de início é obrigatório")
    @JsonFormat(pattern = "HH:mm")
    @JsonAlias({"start_time", "startTime"})
    private LocalTime startTime;

    @NotNull(message = "A data de término é obrigatória")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @JsonAlias({"end_date", "endDate"})
    private LocalDate endDate;

    @NotNull(message = "O horário de término é obrigatório")
    @JsonFormat(pattern = "HH:mm")
    @JsonAlias({"end_time", "endTime"})
    private LocalTime endTime;

    @NotNull(message = "A quantidade de pessoas é obrigatória")
    @Min(value = 1, message = "A viagem deve ter no mínimo 1 pessoa")
    @JsonAlias({"people_count", "peopleCount"})
    private Integer peopleCount;
}
