package com.storepricetrack.store_price_track.modules.trips.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.trips.dto.TripParticipantDto;
import com.storepricetrack.store_price_track.modules.trips.dto.TripRequestDto;
import com.storepricetrack.store_price_track.modules.trips.dto.TripResponseDto;
import com.storepricetrack.store_price_track.modules.trips.entity.*;
import com.storepricetrack.store_price_track.modules.trips.repository.TripParticipantRepository;
import com.storepricetrack.store_price_track.modules.trips.repository.TripRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripService {

    private final TripRepository tripRepository;
    private final TripParticipantRepository participantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TripResponseDto> getUserTrips(User user) {
        return tripRepository.findAllTripsForUser(user).stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripResponseDto createTrip(TripRequestDto request, User user) {
        LocalDate today = LocalDate.now();
        if (request.getStartDate().isBefore(today)) {
            throw new IllegalArgumentException("A data de início da viagem não pode ser anterior à data de hoje.");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("A data de término não pode ser anterior à data de início.");
        }

        TripEntity trip = TripEntity.builder()
                .destination(request.getDestination().trim())
                .address(request.getAddress() != null ? request.getAddress().trim() : "")
                .startDate(request.getStartDate())
                .startTime(request.getStartTime())
                .endDate(request.getEndDate())
                .endTime(request.getEndTime())
                .peopleCount(request.getPeopleCount())
                .createdBy(user)
                .participants(new ArrayList<>())
                .build();

        // Adiciona automaticamente o criador como ORGANIZADOR
        TripParticipantEntity organizer = TripParticipantEntity.builder()
                .trip(trip)
                .user(user)
                .name(user.getUsername())
                .role(TripParticipantRole.ORGANIZER)
                .status(TripParticipantStatus.ACCEPTED)
                .balance(BigDecimal.ZERO)
                .build();

        trip.getParticipants().add(organizer);

        TripEntity saved = tripRepository.save(trip);
        return toResponseDto(saved);
    }

    @Transactional
    public TripResponseDto getTripById(Long tripId, User currentUser) {
        TripEntity trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada com o ID: " + tripId));

        // Se o usuário logado ainda não é participante (acessou via link compartilhado), adiciona-o como convidado
        if (currentUser != null) {
            boolean isAlreadyParticipant = trip.getParticipants().stream()
                    .anyMatch(p -> p.getUser() != null && Objects.equals(p.getUser().getId(), currentUser.getId()));

            if (!isAlreadyParticipant) {
                TripParticipantEntity guest = TripParticipantEntity.builder()
                        .trip(trip)
                        .user(currentUser)
                        .name(currentUser.getUsername())
                        .role(TripParticipantRole.GUEST)
                        .status(TripParticipantStatus.ACCEPTED)
                        .balance(BigDecimal.ZERO)
                        .build();

                // Se todos os slots já estavam cheios, expande a capacidade para comportar o novo amigo
                if (trip.getParticipants().size() >= trip.getPeopleCount()) {
                    trip.setPeopleCount(trip.getParticipants().size() + 1);
                }

                trip.getParticipants().add(guest);
                trip = tripRepository.save(trip);
            }
        }

        // Auto-cura: garante que participantes na viagem possuam associação com User caso user_id esteja nulo
        if (trip.getParticipants().isEmpty() && trip.getCreatedBy() != null) {
            TripParticipantEntity organizer = TripParticipantEntity.builder()
                    .trip(trip)
                    .user(trip.getCreatedBy())
                    .name(trip.getCreatedBy().getUsername())
                    .role(TripParticipantRole.ORGANIZER)
                    .status(TripParticipantStatus.ACCEPTED)
                    .balance(BigDecimal.ZERO)
                    .build();
            trip.getParticipants().add(organizer);
            trip = tripRepository.save(trip);
        } else {
            boolean needsSave = false;
            for (TripParticipantEntity p : trip.getParticipants()) {
                if (p.getUser() == null) {
                    if (p.getRole() == TripParticipantRole.ORGANIZER && trip.getCreatedBy() != null) {
                        p.setUser(trip.getCreatedBy());
                        needsSave = true;
                    } else if (p.getName() != null) {
                        var foundUser = userRepository.findByUsername(p.getName());
                        if (foundUser.isPresent()) {
                            p.setUser(foundUser.get());
                            needsSave = true;
                        }
                    }
                }
            }
            if (needsSave) {
                trip = tripRepository.save(trip);
            }
        }

        return toResponseDto(trip);
    }

    @Transactional
    public TripResponseDto increaseCapacity(Long tripId, User user) {
        TripEntity trip = getTripAndVerifyOrganizer(tripId, user);
        trip.setPeopleCount(trip.getPeopleCount() + 1);
        TripEntity saved = tripRepository.save(trip);
        return toResponseDto(saved);
    }

    @Transactional
    public TripResponseDto decreaseCapacity(Long tripId, User user) {
        TripEntity trip = getTripAndVerifyOrganizer(tripId, user);

        if (trip.getPeopleCount() <= 1) {
            throw new IllegalArgumentException("A viagem deve ter no mínimo 1 vaga.");
        }

        if (trip.getPeopleCount() <= trip.getParticipants().size()) {
            throw new IllegalArgumentException("Não é possível remover vaga vazia pois todas as vagas atuais estão ocupadas.");
        }

        trip.setPeopleCount(trip.getPeopleCount() - 1);
        TripEntity saved = tripRepository.save(trip);
        return toResponseDto(saved);
    }

    @Transactional
    public TripResponseDto revokeParticipant(Long tripId, Long participantId, User user) {
        TripEntity trip = getTripAndVerifyOrganizer(tripId, user);

        TripParticipantEntity target = trip.getParticipants().stream()
                .filter(p -> Objects.equals(p.getId(), participantId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Participante não encontrado na viagem."));

        if (target.getRole() == TripParticipantRole.ORGANIZER) {
            throw new IllegalArgumentException("O organizador não pode revogar sua própria vaga.");
        }

        // Regra de segurança financeira: bloqueia exclusão de participantes com saldo em aberto
        if (target.getBalance() != null && target.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException("Não é possível remover este participante pois ele possui pendências financeiras ativas na viagem. Quite as despesas antes de revogar a vaga.");
        }

        // Remove o participante da lista. A capacidade total (peopleCount) é MANTIDA,
        // fazendo com que a vaga liberada volte a ser uma "Vaga disponível" automaticamente.
        trip.getParticipants().remove(target);
        participantRepository.delete(target);

        TripEntity saved = tripRepository.save(trip);
        return toResponseDto(saved);
    }

    @Transactional
    public TripResponseDto updateTrip(Long tripId, TripRequestDto request, User user) {
        TripEntity trip = getTripAndVerifyOrganizer(tripId, user);

        LocalDate today = LocalDate.now();
        if (request.getStartDate().isBefore(today) && !request.getStartDate().equals(trip.getStartDate())) {
            throw new IllegalArgumentException("A nova data de início não pode ser anterior à data de hoje.");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("A data de término não pode ser anterior à data de início.");
        }

        // Não permite diminuir a quantidade de pessoas abaixo do total de participantes atuais
        int currentOccupied = trip.getParticipants().size();
        if (request.getPeopleCount() < currentOccupied) {
            throw new IllegalArgumentException(
                    "A quantidade de pessoas (" + request.getPeopleCount() +
                    ") não pode ser menor que o total de participantes no grupo (" + currentOccupied + ")."
            );
        }

        trip.setDestination(request.getDestination().trim());
        if (request.getAddress() != null && !request.getAddress().trim().isEmpty()) {
            trip.setAddress(request.getAddress().trim());
        }
        trip.setStartDate(request.getStartDate());
        trip.setStartTime(request.getStartTime());
        trip.setEndDate(request.getEndDate());
        trip.setEndTime(request.getEndTime());
        trip.setPeopleCount(request.getPeopleCount());

        TripEntity saved = tripRepository.save(trip);
        return toResponseDto(saved);
    }

    @Transactional
    public void deleteTrip(Long tripId, User user) {
        TripEntity trip = getTripAndVerifyOrganizer(tripId, user);
        tripRepository.delete(trip);
    }

    private TripEntity getTripAndVerifyOrganizer(Long tripId, User user) {
        TripEntity trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada com o ID: " + tripId));

        boolean isOrganizer = Objects.equals(trip.getCreatedBy().getId(), user.getId()) ||
                trip.getParticipants().stream()
                        .anyMatch(p -> p.getUser() != null &&
                                Objects.equals(p.getUser().getId(), user.getId()) &&
                                p.getRole() == TripParticipantRole.ORGANIZER);

        if (!isOrganizer) {
            throw new IllegalArgumentException("Apenas o organizador da viagem tem permissão para esta operação.");
        }

        return trip;
    }

    private TripResponseDto toResponseDto(TripEntity entity) {
        List<TripParticipantDto> participantDtos = entity.getParticipants().stream()
                .map(p -> {
                    Long userId = p.getUser() != null ? p.getUser().getId() : null;
                    if (userId == null && p.getRole() == TripParticipantRole.ORGANIZER && entity.getCreatedBy() != null) {
                        userId = entity.getCreatedBy().getId();
                    }
                    return TripParticipantDto.builder()
                            .id(p.getId())
                            .userId(userId)
                            .name(p.getName())
                            .role(p.getRole().name().equalsIgnoreCase("ORGANIZER") ? "Organizador" : "Amigo")
                            .status(p.getStatus().name().equalsIgnoreCase("ACCEPTED") ? "accepted" : "pending")
                            .balance(p.getBalance() != null ? p.getBalance() : BigDecimal.ZERO)
                            .joinedAt(p.getJoinedAt())
                            .build();
                })
                .collect(Collectors.toList());

        // Se por algum motivo a lista de participantes estiver vazia mas houver criador
        if (participantDtos.isEmpty() && entity.getCreatedBy() != null) {
            participantDtos.add(TripParticipantDto.builder()
                    .id(entity.getCreatedBy().getId())
                    .userId(entity.getCreatedBy().getId())
                    .name(entity.getCreatedBy().getUsername())
                    .role("Organizador")
                    .status("accepted")
                    .balance(BigDecimal.ZERO)
                    .joinedAt(entity.getCreatedAt())
                    .build());
        }

        return TripResponseDto.builder()
                .id(entity.getId())
                .destination(entity.getDestination())
                .address(entity.getAddress())
                .startDate(entity.getStartDate())
                .startTime(entity.getStartTime())
                .endDate(entity.getEndDate())
                .endTime(entity.getEndTime())
                .peopleCount(entity.getPeopleCount())
                .status(entity.getCalculatedStatus().name().toLowerCase())
                .createdByUserId(entity.getCreatedBy() != null ? entity.getCreatedBy().getId() : null)
                .createdByUsername(entity.getCreatedBy() != null ? entity.getCreatedBy().getUsername() : null)
                .participants(participantDtos)
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
