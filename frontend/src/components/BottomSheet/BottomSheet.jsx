import React from 'react';
import { createPortal } from 'react-dom';
import { Plus, Minus, X } from 'lucide-react';
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
  onRemoveFromSheet
}) {
  if (!isOpen) return null;

  return createPortal(
    <>
      <div className="bottom-sheet-overlay" onClick={onClose}></div>
      <div className="bottom-sheet animate-slide-up-fast">
        <div className="bottom-sheet-header">
          <h3>Buscar Produtos</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="categories-scroll">
          {dynamicCategories.map(cat => (
            <button 
              key={cat} 
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="sheet-products-list">
          {productsList
            .filter(p => selectedCategory === 'Todos' || p.category === selectedCategory)
            .map(product => {
              const addedItem = items.find(i => i.name === product.name);
              return (
                <div key={product.id} className="sheet-product-item">
                  <div className="sheet-product-info">
                    <span className="sheet-product-name">
                      {product.name}
                      <CategoryBadge category={product.category} />
                      {addedItem && <span className="added-badge">{addedItem.qty}x na lista</span>}
                    </span>
                    <span className="sheet-product-price">R$ {product.price.toFixed(2).replace('.', ',')} (Média)</span>
                  </div>
                  <div className="sheet-product-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {addedItem && addedItem.qty > 0 && (
                      <button className="sub-sheet-btn" onClick={() => onRemoveFromSheet(product)}>
                        <Minus size={20} />
                      </button>
                    )}
                    <button className="add-sheet-btn" onClick={() => onAddFromSheet(product)}>
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              );
            })
          }
        </div>
      </div>
    </>,
    document.getElementById('root')
  );
}
