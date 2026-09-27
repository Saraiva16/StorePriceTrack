import React from 'react';
import { Trash2 } from 'lucide-react';
import './ProductsTable.css';

export default function ProductsTable({ items, onUpdateItem, onRemoveItem }) {
  return (
    <div className="products-table-container">
      <h3 className="table-title">Lista de produtos</h3>
      
      <div className="table-responsive">
        <table className="products-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th>Vlr Unit</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.name}</td>
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
                  <input 
                    type="text" 
                    value={`R$ ${Number(item.unitPrice).toFixed(2).replace('.', ',')}`}
                    readOnly
                    className="cell-input price-input"
                    style={{ backgroundColor: '#f0f0f0', color: '#666', border: '1px solid #ddd', cursor: 'not-allowed' }}
                  />
                </td>
                <td className="total-cell">R$ {(item.qty * item.unitPrice).toFixed(2).replace('.', ',')}</td>
                <td>
                  <button className="delete-btn" onClick={() => onRemoveItem(item.id)}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">Nenhum produto adicionado</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
