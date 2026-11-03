const getHeaders = () => ({
  'Content-Type': 'application/json'
});

const fetchOptions = {
  credentials: 'include' // Garante o envio do cookie HttpOnly 'jwt' para autenticação
};

export const fetchNetworks = async () => {
  try {
    const res = await fetch('/api/markets/networks', {
      headers: getHeaders(),
      ...fetchOptions
    });
    if (!res.ok) {
      console.error('Falha ao buscar redes de mercados. Status:', res.status);
      return [];
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('Erro na requisição fetchNetworks:', err);
    return [];
  }
};

export const fetchProducts = async () => {
  let allProducts = [];
  let page = 0;
  let hasMore = true;
  const size = 100;

  while (hasMore) {
    try {
      const res = await fetch(`/api/products?size=${size}&page=${page}`, {
        headers: getHeaders(),
        ...fetchOptions
      });
      if (!res.ok) {
        console.error('Falha ao buscar produtos. Status:', res.status);
        throw new Error(`Failed to fetch: ${res.status}`);
      }
      const data = await res.json();
      const list = data.content || (data._embedded && data._embedded.productMasterDTOList) || [];
      allProducts = [...allProducts, ...list];
      
      if (list.length < size) {
        hasMore = false;
      } else {
        page++;
      }
    } catch (error) {
      console.error("Error fetching products on page", page, error);
      hasMore = false;
    }
  }

  return allProducts.map(p => ({
    id: p.id,
    name: p.normalized_name || p.normalizedName,
    category: p.category_name || p.categoryName || 'Outros',
    price: 0.00
  }));
};

export const recalculatePrices = async (marketName, productNames) => {
  if (!marketName || productNames.length === 0) return {};
  try {
    const res = await fetch('/api/estimate/recalculate', {
      method: 'POST',
      headers: getHeaders(),
      ...fetchOptions,
      body: JSON.stringify({ market_name: marketName, products: productNames })
    });
    if (!res.ok) {
      console.error('Falha ao recalcular preços. Status:', res.status);
      return {};
    }
    return await res.json();
  } catch (err) {
    console.error('Erro ao recalcular preços:', err);
    return {};
  }
};

export const createProduct = async (productData) => {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: getHeaders(),
      ...fetchOptions,
      body: JSON.stringify({
        normalizedName: productData.normalizedName || productData.name,
        brand: productData.brand || null,
        unitMeasure: productData.unitMeasure || 'un',
        categoryId: productData.categoryId || null
      })
    });
    if (!res.ok) {
      console.warn('Backend rejected product creation, fallback to local item. Status:', res.status);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error('Failed to create product in master catalog', err);
    return null;
  }
};
