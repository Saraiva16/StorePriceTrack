/**
 * TripExpenseService.js
 * Gerenciamento de despesas coletivas, rateios e chaves Pix da viagem.
 */

const API_BASE = '/api/trips';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const fetchOptions = {
  credentials: 'include'
};

export const fetchTripExpenses = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}/expenses`, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar despesas da viagem.');
  return await res.json();
};

export const createTripExpense = async (tripId, expenseData) => {
  const res = await fetch(`${API_BASE}/${tripId}/expenses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(expenseData),
    ...fetchOptions
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Erro ao registrar despesa.');
  }
  return await res.json();
};

export const fetchTripDebts = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}/expenses/debts`, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar resumo de dívidas.');
  return await res.json();
};

export const deleteTripExpense = async (tripId, expenseId) => {
  const res = await fetch(`${API_BASE}/${tripId}/expenses/${expenseId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao excluir despesa.');
  return true;
};

export const updateUserPixKey = async (tripId, pixKey) => {
  const res = await fetch(`${API_BASE}/${tripId}/expenses/pix`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ pixKey }),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao atualizar chave Pix.');
  return await res.json();
};
