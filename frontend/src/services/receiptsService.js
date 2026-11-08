const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fetchOptions = {
  credentials: 'include'
};

export const importReceiptFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/receipts/import', {
    method: 'POST',
    headers: {
      ...getAuthHeaders()
    },
    ...fetchOptions,
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const err = new Error(errorData?.error || errorData?.message || 'Falha ao processar nota');
    err.status = res.status;
    err.data = errorData;
    throw err;
  }

  return await res.json();
};

export const importNfceUrl = async (url) => {
  const res = await fetch('/api/receipts/import/nfce-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    ...fetchOptions,
    body: JSON.stringify({ url })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const err = new Error(errorData?.error || errorData?.message || 'Falha ao importar NFC-e');
    err.status = res.status;
    err.data = errorData;
    throw err;
  }

  return await res.json();
};

export const submitConfirmedReceipt = async (payload) => {
  const res = await fetch('/api/receipts/curation/submit-confirmed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    ...fetchOptions,
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const err = new Error(errorData?.error || errorData?.message || 'Falha ao enviar conferência da nota');
    err.status = res.status;
    err.data = errorData;
    throw err;
  }

  return await res.json();
};
