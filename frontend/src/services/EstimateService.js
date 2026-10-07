export const fetchNetworks = async () => {
  const res = await fetch('/api/markets/networks');
  return res.json();
};

export const fetchProducts = async () => {
  let allProducts = [];
  let page = 0;
  let hasMore = true;
  const size = 100;

  while (hasMore) {
    try {
      const res = await fetch(`/api/products?size=${size}&page=${page}`);
      if (!res.ok) throw new Error('Failed to fetch');
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
  const res = await fetch('/api/estimate/recalculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ market_name: marketName, products: productNames })
  });
  return res.json();
};
