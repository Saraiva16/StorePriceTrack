const API_BASE = '/api/trips';

const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const fetchOptions = {
  credentials: 'include'
};

export const normalizeTripShoppingItem = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    tripId: item.trip_id ?? item.tripId,
    name: item.name,
    qty: Number(item.quantity ?? item.qty) || 1,
    unitPrice: Number(item.unit_price ?? item.unitPrice ?? 0),
    category: item.category || 'Outros',
    isCustomPrice: item.is_custom_price ?? item.isCustomPrice ?? false,
    checked: Boolean(item.checked),
    addedByUserId: item.added_by_user_id ?? item.addedByUserId,
    addedByName: item.added_by_name ?? item.addedByName
  };
};

export const fetchTripShoppingItems = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}/items`, {
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao buscar itens da viagem');
  const data = await res.json();
  return Array.isArray(data) ? data.map(normalizeTripShoppingItem) : [];
};

export const addTripShoppingItem = async (tripId, itemData) => {
  const res = await fetch(`${API_BASE}/${tripId}/items`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      name: itemData.name,
      quantity: itemData.quantity || itemData.qty || 1,
      unit_price: itemData.unitPrice ?? itemData.price ?? 0,
      unitPrice: itemData.unitPrice ?? itemData.price ?? 0,
      category: itemData.category || 'Outros',
      is_custom_price: itemData.isCustomPrice ?? true,
      isCustomPrice: itemData.isCustomPrice ?? true,
      checked: Boolean(itemData.checked)
    }),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao adicionar item à viagem');
  const data = await res.json();
  return normalizeTripShoppingItem(data);
};

export const updateTripShoppingItem = async (tripId, itemId, itemData) => {
  const res = await fetch(`${API_BASE}/${tripId}/items/${itemId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({
      name: itemData.name,
      quantity: itemData.quantity || itemData.qty,
      unit_price: itemData.unitPrice,
      unitPrice: itemData.unitPrice,
      category: itemData.category,
      is_custom_price: itemData.isCustomPrice,
      isCustomPrice: itemData.isCustomPrice,
      checked: itemData.checked !== undefined ? Boolean(itemData.checked) : undefined
    }),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao atualizar item da viagem');
  const data = await res.json();
  return normalizeTripShoppingItem(data);
};

export const deleteTripShoppingItem = async (tripId, itemId) => {
  const res = await fetch(`${API_BASE}/${tripId}/items/${itemId}`, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao remover item da viagem');
  return true;
};

export const clearTripShoppingItems = async (tripId) => {
  const res = await fetch(`${API_BASE}/${tripId}/items`, {
    method: 'DELETE',
    headers: getHeaders(),
    ...fetchOptions
  });
  if (!res.ok) throw new Error('Falha ao limpar itens da viagem');
  return true;
};
