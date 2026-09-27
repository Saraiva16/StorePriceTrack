export const fetchNetworks = async () => {
  const res = await fetch('/api/markets/networks');
  return res.json();
};

export const fetchProducts = async () => {
  const res = await fetch('/api/products?size=100');
  const data = await res.json();
  const list = data.content || (data._embedded && data._embedded.productMasterDTOList) || [];
  return list.map(p => ({
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
