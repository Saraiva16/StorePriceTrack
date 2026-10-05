const API_BASE = '/api/shopping-list';

const getHeaders = () => {
    return {
        'Content-Type': 'application/json'
    };
};

const fetchOptions = {
    credentials: 'include' // This ensures the 'jwt' cookie is sent
};

export const fetchActiveCart = async () => {
    const res = await fetch(`${API_BASE}/active`, { 
        headers: getHeaders(),
        ...fetchOptions 
    });
    if (!res.ok) throw new Error('Failed to fetch active cart');
    return res.json();
};

export const addItemToCart = async (productId, quantity) => {
    // Note: the backend uses @RequestParam, so we pass it in the URL
    const res = await fetch(`${API_BASE}/add-item?productId=${productId}&quantity=${quantity}`, {
        method: 'POST',
        headers: getHeaders(),
        ...fetchOptions
    });
    if (!res.ok) throw new Error('Failed to add item');
    return res.json();
};

export const closeCart = async () => {
    const res = await fetch(`${API_BASE}/close`, {
        method: 'POST',
        headers: getHeaders(),
        ...fetchOptions
    });
    if (!res.ok) throw new Error('Failed to close cart');
    return res.json();
};

export const uploadReceipt = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`/api/receipts/import`, {
        method: 'POST',
        body: formData,
        ...fetchOptions
    });
    
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to upload receipt');
    }
    return res.json();
};

export const getComparisonReport = async (shoppingListId, receiptId) => {
    const res = await fetch(`${API_BASE}/${shoppingListId}/compare/${receiptId}`, {
        headers: getHeaders(),
        ...fetchOptions
    });
    if (!res.ok) throw new Error('Failed to fetch comparison');
    return res.json();
};
