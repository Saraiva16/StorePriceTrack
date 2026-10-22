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

export const fetchAllUsers = async () => {
  try {
    const res = await fetch('/api/users', {
      headers: getHeaders(),
      ...fetchOptions
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (e) {
    console.warn('Erro ao carregar usuários do sistema:', e);
    return [];
  }
};

export const createTripExpense = async (tripId, expenseData) => {
  const payload = {
    ...expenseData,
    expense_date: expenseData.expenseDate || expenseData.expense_date,
    participant_user_ids: expenseData.participantUserIds || expenseData.participant_user_ids
  };

  const res = await fetch(`${API_BASE}/${tripId}/expenses`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
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

export const updateUserPixKey = async (arg1, arg2) => {
  // Suporta tanto updateUserPixKey(pixKey) quanto updateUserPixKey(tripId, pixKey)
  const pixKey = arg2 !== undefined ? arg2 : arg1;
  const tripId = arg2 !== undefined ? arg1 : null;

  try {
    const res = await fetch('/api/users/pix', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ pixKey }),
      ...fetchOptions
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Erro ao atualizar chave pix em /api/users/pix, tentando fallback:', err);
  }

  // Fallback para rota de viagem se fornecido tripId
  if (tripId) {
    const fallbackRes = await fetch(`${API_BASE}/${tripId}/expenses/pix`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ pixKey }),
      ...fetchOptions
    });
    if (!fallbackRes.ok) throw new Error('Falha ao atualizar chave Pix.');
    return await fallbackRes.json();
  }

  throw new Error('Falha ao atualizar chave Pix do usuário.');
};

export const fetchUserPixKey = async () => {
  const res = await fetch('/api/users/pix', {
    method: 'GET',
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao carregar chave Pix do usuário.');
  return await res.json();
};
