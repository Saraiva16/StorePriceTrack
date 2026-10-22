/**
 * TripService.js
 * Gerenciamento centralizado de viagens (trips).
 * 
 * Conectado à API REST Spring Boot (/api/trips) para sincronização
 * em tempo real entre celulares e dispositivos via MySQL.
 */

const API_BASE = '/api/trips';

const fetchOptions = {
  credentials: 'include' // Envia cookie httpOnly de autenticação JWT
};

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

/**
 * Calcula o status da viagem dinamicamente com base nas datas e horários
 * @param {string} startDate 'YYYY-MM-DD'
 * @param {string} startTime 'HH:mm'
 * @param {string} endDate 'YYYY-MM-DD'
 * @param {string} endTime 'HH:mm'
 * @returns {'active' | 'scheduled' | 'completed'}
 */
export const calculateTripStatus = (startDate, startTime = '00:00', endDate, endTime = '23:59') => {
  if (!startDate || !endDate) return 'scheduled';

  const now = new Date();
  const startDateTime = new Date(`${startDate}T${startTime}:00`);
  const endDateTime = new Date(`${endDate}T${endTime}:00`);

  if (now < startDateTime) {
    return 'scheduled';
  } else if (now >= startDateTime && now <= endDateTime) {
    return 'active';
  } else {
    return 'completed';
  }
};

/**
 * Validação rigorosa dos dados da viagem
 */
export const validateTripData = (data) => {
  const errors = {};
  const todayStr = new Date().toISOString().split('T')[0];

  if (!data.destination || data.destination.trim().length === 0) {
    errors.destination = 'Informe o destino da viagem.';
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Informe o endereço da viagem.';
  }

  if (!data.startDate) {
    errors.startDate = 'Informe a data de início.';
  } else if (data.startDate < todayStr) {
    errors.startDate = 'A data de início não pode ser no passado.';
  }

  if (!data.endDate) {
    errors.endDate = 'Informe a data de término.';
  } else if (data.startDate && data.endDate < data.startDate) {
    errors.endDate = 'A data de término não pode ser anterior à data de início.';
  }

  if (data.startDate && data.endDate && data.startDate === data.endDate) {
    const startTime = data.startTime || '00:00';
    const endTime = data.endTime || '23:59';
    if (endTime < startTime) {
      errors.endTime = 'Para o mesmo dia, o horário de término deve ser posterior ao de início.';
    }
  }

  const people = Number(data.peopleCount);
  if (!people || isNaN(people) || people < 1) {
    errors.peopleCount = 'A quantidade de pessoas deve ser no mínimo 1.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Normaliza os dados da viagem recebidos do Spring Boot (suporte bidirecional a snake_case e camelCase)
 */
const normalizeTripDto = (data) => {
  if (!data) return null;
  return {
    ...data,
    id: data.id,
    destination: data.destination,
    address: data.address || '',
    startDate: data.startDate || data.start_date,
    startTime: data.startTime || data.start_time,
    endDate: data.endDate || data.end_date,
    endTime: data.endTime || data.end_time,
    peopleCount: Number(data.peopleCount || data.people_count) || 1,
    status: data.status,
    createdByUserId: data.createdByUserId || data.created_by_user_id,
    createdByUsername: data.createdByUsername || data.created_by_username,
    participants: (data.participants || []).map(p => ({
      ...p,
      userId: p.userId || p.user_id,
      name: p.name,
      role: p.role,
      status: p.status,
      balance: p.balance !== undefined ? p.balance : 0,
      joinedAt: p.joinedAt || p.joined_at
    }))
  };
};

/**
 * Retorna todas as viagens vinculadas ao usuário logado a partir do servidor
 */
export const getTrips = async () => {
  try {
    const res = await fetch(API_BASE, {
      ...fetchOptions,
      headers: getHeaders()
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) return [];
      throw new Error('Falha ao carregar viagens do servidor.');
    }

    const data = await res.json();
    return Array.isArray(data) ? data.map(normalizeTripDto) : [];
  } catch (error) {
    console.error('Erro ao recuperar viagens:', error);
    return [];
  }
};

/**
 * Busca uma viagem por ID no backend Spring Boot
 * Se o usuário logado ainda não for participante, o backend o adiciona automaticamente via link
 */
export const getTripById = async (tripId) => {
  if (!tripId) return null;

  try {
    const res = await fetch(`${API_BASE}/${tripId}`, {
      ...fetchOptions,
      headers: getHeaders()
    });

    if (!res.ok) {
      console.warn(`[getTripById] Resposta não-ok do servidor (${res.status}) para o ID: ${tripId}`);
      return null;
    }

    const data = await res.json();
    return normalizeTripDto(data);
  } catch (error) {
    console.error('Erro ao buscar viagem no servidor:', error);
    return null;
  }
};

/**
 * Cria e persiste uma nova viagem no backend Spring Boot + MySQL
 */
export const createTrip = async (tripData) => {
  const validation = validateTripData(tripData);
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0] || 'Dados da viagem inválidos.');
  }

  const payload = {
    destination: tripData.destination.trim(),
    address: tripData.address.trim(),
    start_date: tripData.startDate,
    start_time: tripData.startTime || '08:00',
    end_date: tripData.endDate,
    end_time: tripData.endTime || '18:00',
    people_count: Number(tripData.peopleCount) || 1,
    startDate: tripData.startDate,
    startTime: tripData.startTime || '08:00',
    endDate: tripData.endDate,
    endTime: tripData.endTime || '18:00',
    peopleCount: Number(tripData.peopleCount) || 1
  };

  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: getHeaders(),
    ...fetchOptions,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Erro ao cadastrar viagem no servidor.');
  }

  const data = await res.json();
  return normalizeTripDto(data);
};

/**
 * Revoga a vaga de um participante da viagem no servidor
 * Apenas o organizador pode revogar. A vaga liberada volta a ser uma vaga aberta disponível.
 * Bloqueia revogação se houver saldo/despesas em aberto.
 */
export const revokeParticipant = async (tripId, participantId) => {
  const res = await fetch(`${API_BASE}/${tripId}/participants/${participantId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Erro ao revogar participante da viagem.');
  }

  const data = await res.json();
  return normalizeTripDto(data);
};

/**
 * Adiciona mais uma vaga na viagem (incrementa a capacidade em 1)
 */
export const increaseTripCapacity = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}/increase-capacity`, {
    method: 'POST',
    headers: getHeaders(),
    ...fetchOptions
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Erro ao adicionar vaga na viagem.');
  }

  const data = await res.json();
  return normalizeTripDto(data);
};

/**
 * Remove uma vaga da viagem (decrementa a capacidade em 1 caso haja vagas sobressalentes)
 */
export const decreaseTripCapacity = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}/decrease-capacity`, {
    method: 'POST',
    headers: getHeaders(),
    ...fetchOptions
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Erro ao excluir vaga da viagem.');
  }

  const data = await res.json();
  return normalizeTripDto(data);
};

/**
 * Atualiza as informações da viagem (destino, datas, horários e capacidade)
 */
export const updateTrip = async (tripId, tripData) => {
  const validation = validateTripData(tripData);
  if (!validation.isValid) {
    throw new Error(Object.values(validation.errors)[0] || 'Dados da viagem inválidos.');
  }

  const payload = {
    destination: tripData.destination.trim(),
    address: tripData.address ? tripData.address.trim() : '',
    start_date: tripData.startDate,
    start_time: tripData.startTime || '08:00',
    end_date: tripData.endDate,
    end_time: tripData.endTime || '18:00',
    people_count: Number(tripData.peopleCount) || 1,
    startDate: tripData.startDate,
    startTime: tripData.startTime || '08:00',
    endDate: tripData.endDate,
    endTime: tripData.endTime || '18:00',
    peopleCount: Number(tripData.peopleCount) || 1
  };

  const res = await fetch(`${API_BASE}/${tripId}`, {
    method: 'PUT',
    headers: getHeaders(),
    ...fetchOptions,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Erro ao atualizar dados da viagem no servidor.');
  }

  const data = await res.json();
  return normalizeTripDto(data);
};

/**
 * Remove uma viagem pelo ID
 */
export const deleteTrip = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || 'Erro ao excluir viagem.');
  }

  return true;
};
