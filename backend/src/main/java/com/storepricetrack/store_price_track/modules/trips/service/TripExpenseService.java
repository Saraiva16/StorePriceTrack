package com.storepricetrack.store_price_track.modules.trips.service;

import com.storepricetrack.store_price_track.modules.auth.entity.User;
import com.storepricetrack.store_price_track.modules.auth.repository.UserRepository;
import com.storepricetrack.store_price_track.modules.trips.dto.*;
import com.storepricetrack.store_price_track.modules.trips.entity.TripEntity;
import com.storepricetrack.store_price_track.modules.trips.entity.TripExpenseEntity;
import com.storepricetrack.store_price_track.modules.trips.entity.TripExpenseSplitEntity;
import com.storepricetrack.store_price_track.modules.trips.repository.TripExpenseRepository;
import com.storepricetrack.store_price_track.modules.trips.repository.TripExpenseSplitRepository;
import com.storepricetrack.store_price_track.modules.trips.repository.TripRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TripExpenseService {

    private final TripRepository tripRepository;
    private final TripExpenseRepository expenseRepository;
    private final TripExpenseSplitRepository splitRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<TripExpenseResponseDTO> getTripExpenses(Long tripId, User user) {
        verifyTripExists(tripId);
        return expenseRepository.findByTripIdOrderByExpenseDateDescIdDesc(tripId).stream()
                .map(this::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public TripExpenseResponseDTO createExpense(Long tripId, TripExpenseRequestDTO request, User currentUser) {
        TripEntity trip = tripRepository.findById(tripId)
                .orElseThrow(() -> new EntityNotFoundException("Viagem não encontrada com id: " + tripId));

        if (request.participantUserIds() == null || request.participantUserIds().isEmpty()) {
            throw new IllegalArgumentException("Selecione pelo menos um amigo para dividir a despesa.");
        }

        // Recupera usuários que farão o rateio
        List<User> participants = userRepository.findAllById(request.participantUserIds());
        if (participants.isEmpty()) {
            throw new IllegalArgumentException("Nenhum participante válido foi encontrado para o rateio.");
        }

        BigDecimal totalAmount = request.amount().setScale(2, RoundingMode.HALF_UP);
        int numPeople = participants.size();
        BigDecimal baseShare = totalAmount.divide(BigDecimal.valueOf(numPeople), 2, RoundingMode.FLOOR);
        BigDecimal remainder = totalAmount.subtract(baseShare.multiply(BigDecimal.valueOf(numPeople)));

        TripExpenseEntity expense = TripExpenseEntity.builder()
                .trip(trip)
                .paidBy(currentUser)
                .description(request.description().trim())
                .amount(totalAmount)
                .expenseDate(request.expenseDate())
                .splits(new ArrayList<>())
                .build();

        for (int i = 0; i < participants.size(); i++) {
            User p = participants.get(i);
            // Distribui os centavos residuais na primeira parcela
            BigDecimal share = (i == 0) ? baseShare.add(remainder) : baseShare;

            TripExpenseSplitEntity split = TripExpenseSplitEntity.builder()
                    .expense(expense)
                    .user(p)
                    .shareAmount(share)
                    .build();

            expense.getSplits().add(split);
        }

        TripExpenseEntity saved = expenseRepository.save(expense);
        return toResponseDTO(saved);
    }

    @Transactional(readOnly = true)
    public List<UserDebtSummaryDTO> getUserDebts(Long tripId, User currentUser) {
        verifyTripExists(tripId);

        // Busca todas as despesas da viagem onde currentUser tem uma fatia no rateio
        List<TripExpenseEntity> allExpenses = expenseRepository.findByTripIdOrderByExpenseDateDescIdDesc(tripId);

        // Agrupa débitos por usuário credor (quem pagou e não é o próprio usuário atual)
        Map<Long, List<DebtDetailItemDTO>> debtsByCreditor = new LinkedHashMap<>();
        Map<Long, User> creditorsById = new HashMap<>();

        for (TripExpenseEntity exp : allExpenses) {
            User paidBy = exp.getPaidBy();
            if (paidBy.getId().equals(currentUser.getId())) {
                continue; // O usuário pagou essa conta; não deve para si mesmo
            }

            for (TripExpenseSplitEntity split : exp.getSplits()) {
                if (split.getUser().getId().equals(currentUser.getId())) {
                    creditorsById.putIfAbsent(paidBy.getId(), paidBy);
                    debtsByCreditor.computeIfAbsent(paidBy.getId(), k -> new ArrayList<>())
                            .add(new DebtDetailItemDTO(
                                    exp.getId(),
                                    exp.getDescription(),
                                    exp.getExpenseDate(),
                                    exp.getAmount(),
                                    split.getShareAmount()
                            ));
                }
            }
        }

        List<UserDebtSummaryDTO> summaries = new ArrayList<>();
        for (Map.Entry<Long, List<DebtDetailItemDTO>> entry : debtsByCreditor.entrySet()) {
            Long creditorId = entry.getKey();
            User creditor = creditorsById.get(creditorId);
            List<DebtDetailItemDTO> details = entry.getValue();

            BigDecimal totalOwed = details.stream()
                    .map(DebtDetailItemDTO::yourShareAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            summaries.add(new UserDebtSummaryDTO(
                    creditor.getId(),
                    creditor.getUsername(),
                    creditor.getPixKey(),
                    totalOwed,
                    details
            ));
        }

        return summaries;
    }

    @Transactional
    public void deleteExpense(Long tripId, Long expenseId, User currentUser) {
        TripExpenseEntity expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new EntityNotFoundException("Despesa não encontrada com id: " + expenseId));

        if (!expense.getTrip().getId().equals(tripId)) {
            throw new IllegalArgumentException("A despesa não pertence à viagem informada.");
        }

        // Apenas quem pagou ou o organizador da viagem pode excluir a despesa
        boolean isPayer = expense.getPaidBy().getId().equals(currentUser.getId());
        boolean isOrganizer = expense.getTrip().getCreatedBy().getId().equals(currentUser.getId());
        if (!isPayer && !isOrganizer) {
            throw new IllegalArgumentException("Apenas quem pagou ou o organizador pode remover este gasto.");
        }

        expenseRepository.delete(expense);
    }

    private void verifyTripExists(Long tripId) {
        if (!tripRepository.existsById(tripId)) {
            throw new EntityNotFoundException("Viagem não encontrada com id: " + tripId);
        }
    }

    private TripExpenseResponseDTO toResponseDTO(TripExpenseEntity entity) {
        List<TripExpenseSplitDTO> splits = entity.getSplits().stream()
                .map(s -> new TripExpenseSplitDTO(
                        s.getId(),
                        s.getUser().getId(),
                        s.getUser().getUsername(),
                        s.getShareAmount()
                ))
                .collect(Collectors.toList());

        return new TripExpenseResponseDTO(
                entity.getId(),
                entity.getTrip().getId(),
                entity.getPaidBy().getId(),
                entity.getPaidBy().getUsername(),
                entity.getPaidBy().getPixKey(),
                entity.getDescription(),
                entity.getAmount(),
                entity.getExpenseDate(),
                splits,
                entity.getCreatedAt()
        );
    }
}
