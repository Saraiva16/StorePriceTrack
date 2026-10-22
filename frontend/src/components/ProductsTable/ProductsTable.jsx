import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { maskCurrencyInput, parseCurrencyToNumber, formatCurrency } from '../../utils/currency';
import './ProductsTable.css';

function PriceCell({ item, onUpdateItem }) {
  const [val, setVal] = useState(formatCurrency(item.unitPrice));

  useEffect(() => {
    setVal(formatCurrency(item.unitPrice));
  }, [item.unitPrice]);

  const handleChange = (e) => {
    const masked = maskCurrencyInput(e.target.value);
    setVal(masked || '0,00');
    const num = parseCurrencyToNumber(masked);
    onUpdateItem(item.id, { unitPrice: num, isCustomPrice: true });
  };

  return (
    <div className="price-input-wrapper">
      <span className="price-prefix">R$</span>
      <input 
        type="text" 
        inputMode="numeric"
        value={val} 
        onFocus={(e) => e.target.select()}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.target.blur();
          }
        }}
        className="cell-input price-input"
        title="Clique para editar o valor estimado"
      />
    </div>
  );
}

export default function ProductsTable({ items, onUpdateItem, onRemoveItem }) {
  const handleToggleChecked = (item) => {
    onUpdateItem(item.id, { checked: !item.checked });
  };

  return (
    <div className="products-table-container">
      <h3 className="table-title">Lista de produtos</h3>
      
      <div className="table-responsive">
        <table className="products-table">
          <thead>
            <tr>
              <th style={{ width: '38px', textAlign: 'center' }}>✓</th>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Vlr Unit</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const isChecked = Boolean(item.checked);
              return (
                <tr key={item.id} className={isChecked ? 'item-row-checked' : ''}>
                  <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <label className="checkbox-custom-container" title={isChecked ? "Desmarcar item" : "Marcar item como pego"}>
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleToggleChecked(item)}
                        className="checkbox-custom-input"
                      />
                      <span className="checkbox-custom-mark"></span>
                    </label>
                  </td>
                  <td className="product-name-cell">
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="product-title-text" style={{ fontWeight: 500 }}>{item.name}</span>
                      {item.addedByName && (
                        <span className="product-author-text" style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                          por @{item.addedByName}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={item.qty} 
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        onUpdateItem(item.id, 'qty', val);
                      }}
                      onBlur={() => {
                        if (item.qty === '' || Number(item.qty) <= 0) {
                          onUpdateItem(item.id, 'qty', 1);
                        }
                      }}
                      className="cell-input qty-input"
                    />
                  </td>
                  <td>
                    <PriceCell item={item} onUpdateItem={onUpdateItem} />
                  </td>
                  <td className="total-cell">
                    R$ {((Number(item.qty) || 0) * (Number(item.unitPrice) || 0)).toFixed(2).replace('.', ',')}
                  </td>
                  <td>
                    <button className="delete-btn" onClick={() => onRemoveItem(item.id)} title="Remover item">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-state">Nenhum produto adicionado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

