const fetchOptions = {
  credentials: 'include'
};

export const importReceiptFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/receipts/import', {
    method: 'POST',
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
      'Content-Type': 'application/json'
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

