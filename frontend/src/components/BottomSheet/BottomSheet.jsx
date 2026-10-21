import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, X, Search, Sparkles } from 'lucide-react';
import { maskCurrencyInput, parseCurrencyToNumber } from '../../utils/currency';
import CategoryBadge from '../CategoryBadge/CategoryBadge';
import './BottomSheet.css';

export default function BottomSheet({
  isOpen,
  onClose,
  dynamicCategories,
  selectedCategory,
  setSelectedCategory,
  productsList,
  items,
  onAddFromSheet,
  onRemoveFromSheet,
  onAddCustomProduct
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customQty, setCustomQty] = useState('1');

  // Limpa busca quando o modal é fechado
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setCustomPrice('');
      setCustomQty('1');
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return productsList.filter(p => {
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchQuery = !q || (p.name && p.name.toLowerCase().includes(q));
      return matchCategory && matchQuery;
    });
  }, [productsList, selectedCategory, searchQuery]);

  const hasExactMatch = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return false;
    return productsList.some(p => p.name && p.name.toLowerCase() === q);
  }, [productsList, searchQuery]);

  if (!isOpen) return null;

  const handleCreateCustom = (e) => {
    if (e) e.preventDefault();
    const name = searchQuery.trim();
    if (!name) return;

    if (onAddCustomProduct) {
      onAddCustomProduct({
        name,
        price: parseCurrencyToNumber(customPrice),
        qty: customQty,
        category: selectedCategory !== 'Todos' ? selectedCategory : 'Outros'
      });
    }

    setSearchQuery('');
    setCustomPrice('');
    setCustomQty('1');
  };

  return createPortal(
    <>
      <div className="bottom-sheet-overlay" onClick={onClose}></div>
      <div className="bottom-sheet animate-slide-up-fast">
        <div className="bottom-sheet-header">
          <h3>Buscar Produtos</h3>
          <button className="close-btn" onClick={onClose} type="button">
            <X size={24} />
          </button>
        </div>

        {/* Campo de Busca */}
        <div className="sheet-search-box">
          <Search size={18} className="sheet-search-icon" />
          <input 
            type="text"
            placeholder="Buscar ou adicionar produto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="sheet-clear-icon-btn" 
              onClick={() => setSearchQuery('')} 
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </div>
        
        {/* Categorias */}
        <div className="categories-scroll">
          {dynamicCategories.map(cat => (
            <button 
              key={cat} 
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Card para Adicionar Produto Novo com Preço Estimado */}
        {searchQuery.trim().length > 0 && (
          <form className="sheet-custom-card" onSubmit={handleCreateCustom}>
            <div className="custom-card-header">
              <Sparkles size={16} color="var(--accent-color)" />
              <span>
                {hasExactMatch ? 'Adicionar item com preço personalizado:' : 'Produto não listado? Adicione com seu valor estimado:'}
              </span>
            </div>
            <div className="custom-card-body">
              <div className="custom-product-title">
                <strong>"{searchQuery.trim()}"</strong>
              </div>
              <div className="custom-card-fields">
                <div className="custom-field-group">
                  <label>Valor estimado</label>
                  <div className="custom-price-wrapper">
                    <span className="price-prefix">R$</span>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      placeholder="0,00"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(maskCurrencyInput(e.target.value))}
                      className="custom-input-price"
                    />
                  </div>
                </div>

                <div className="custom-field-group custom-field-qty">
                  <label>Qtd</label>
                  <input 
                    type="text"
                    inputMode="numeric"
                    value={customQty}
                    onChange={(e) => setCustomQty(e.target.value.replace(/[^0-9]/g, ''))}
                    className="custom-input-qty"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn-add-custom-product"
                  disabled={!searchQuery.trim()}
                >
                  <Plus size={18} />
                  <span>Adicionar</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Lista de Produtos Encontrados */}
        <div className="sheet-products-list">
          {filteredProducts.map(product => {
            const addedItem = items.find(i => i.name === product.name);
            return (
              <div key={product.id} className="sheet-product-item">
                <div className="sheet-product-info">
                  <span className="sheet-product-name">
                    {product.name}
                    <CategoryBadge category={product.category} />
                    {addedItem && <span className="added-badge">{addedItem.qty}x na lista</span>}
                  </span>
                  <span className="sheet-product-price">
                    R$ {Number(product.price || 0).toFixed(2).replace('.', ',')} (Média)
                  </span>
                </div>
                <div className="sheet-product-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {addedItem && addedItem.qty > 0 && (
                    <button className="sub-sheet-btn" onClick={() => onRemoveFromSheet(product)} type="button">
                      <Minus size={20} />
                    </button>
                  )}
                  <button className="add-sheet-btn" onClick={() => onAddFromSheet(product)} type="button">
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="sheet-empty-results">
              <p>Nenhum produto cadastrado corresponde a "<strong>{searchQuery}</strong>".</p>
              <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
                Preencha o valor estimado acima e clique em <strong>Adicionar</strong> para inseri-lo na sua lista!
              </p>
            </div>
          )}
        </div>
      </div>
    </>,
    document.getElementById('root')
  );
}

