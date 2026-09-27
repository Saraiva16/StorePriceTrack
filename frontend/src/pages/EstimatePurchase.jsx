import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Search, Plus, Trash2, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './EstimatePurchase.css';

export default function EstimatePurchase() {
  const navigate = useNavigate();
  const todayISO = new Date().toISOString().split('T')[0];
  const [market, setMarket] = useState('');
  const [marketsList, setMarketsList] = useState([]);
  const [date, setDate] = useState(todayISO);
  const [newProduct, setNewProduct] = useState('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  const [categories, setCategories] = useState(['Todos']);
  const [productsList, setProductsList] = useState([]);
  const [items, setItems] = useState([]);


  useEffect(() => {
    fetch('/api/markets/networks')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setMarketsList(data);
          setMarket(data[0]);
        } else {
          setMarket('Supermercado');
        }
      })
      .catch(err => {
        console.error('Erro ao buscar mercados:', err);
        setMarket('Supermercado');
      });

    fetch('/api/categories?size=100')
      .then(res => res.json())
      .then(data => {
        const list = data.content || (data._embedded && data._embedded.categoryDTOList) || [];
        setCategories(['Todos', ...list.map(c => c.name)]);
      })
      .catch(err => console.error('Erro ao buscar categorias:', err));

    fetch('/api/products?size=100')
      .then(res => res.json())
      .then(data => {
        const list = data.content || (data._embedded && data._embedded.productMasterDTOList) || [];
        const formatted = list.map(p => ({
          id: p.id,
          name: p.normalized_name || p.normalizedName,
          category: p.category_name || p.categoryName || 'Outros',
          price: 0.00
        }));
        setProductsList(formatted);
      })
      .catch(err => console.error('Erro ao buscar produtos:', err));
  }, []);

  // Recalcula preços quando o mercado muda ou quando a lista de produtos carrega
  useEffect(() => {
    if (!market || productsList.length === 0) return;
    
    const namesToCalculate = new Set();
    items.forEach(item => namesToCalculate.add(item.name));
    productsList.forEach(p => namesToCalculate.add(p.name));

    fetch('/api/estimate/recalculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketName: market, products: Array.from(namesToCalculate) })
    })
      .then(res => res.json())
      .then(newPrices => {
        // Atualiza a lista da cesta
        setItems(prevItems => prevItems.map(item => {
          if (newPrices[item.name] !== undefined) {
            return { ...item, unitPrice: newPrices[item.name] };
          }
          return item;
        }));
        
        // Atualiza os preços sugeridos no Bottom Sheet
        setProductsList(prevProds => prevProds.map(p => {
          if (newPrices[p.name] !== undefined) {
            return { ...p, price: newPrices[p.name] };
          }
          return p;
        }));
      })
      .catch(err => console.error("Erro ao recalcular preços", err));
  }, [market, productsList.length]);

  const totalGeral = items.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newProduct.trim()) return;
    
    const newItem = {
      id: Date.now(),
      name: newProduct,
      qty: 1,
      unitPrice: 0.00
    };
    setItems([...items, newItem]);
    setNewProduct('');
  };

  const handleAddFromSheet = (product) => {
    // Verifica se já existe
    const existing = items.find(i => i.name === product.name);
    if (existing) {
      handleUpdateItem(existing.id, 'qty', existing.qty + 1);
    } else {
      const newItem = {
        id: Date.now() + Math.random(),
        name: product.name,
        qty: 1,
        unitPrice: product.price
      };
      setItems([...items, newItem]);
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const parsedValue = value === '' ? '' : Number(value);
        return { ...item, [field]: parsedValue };
      }
      return item;
    }));
  };

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  return (
    <div className="page-container animate-slide-up estimate-page">
      <div className="header-bar">
        <button className="icon-btn" onClick={() => navigate('/home')}>
          <ChevronLeft size={28} />
        </button>
        <h2>Estimativa</h2>
        <div style={{ width: 28 }}></div>
      </div>

      <div className="estimate-controls">
        <div className="control-group">
          <select value={market} onChange={(e) => setMarket(e.target.value)} className="select-market">
            {marketsList.length > 0 ? (
              marketsList.map(m => (
                <option key={m} value={m}>{m}</option>
              ))
            ) : (
              <option value="Supermercado">Supermercado</option>
            )}
          </select>
          <input 
            type="date" 
            min={todayISO}
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            className="input-date"
          />
        </div>

        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Adicionar novo produto..." 
            value={newProduct}
            onChange={(e) => setNewProduct(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddItem(e);
              }
            }}
          />
          <button type="button" className="filter-btn" onClick={() => setIsBottomSheetOpen(true)}>
            <Filter size={20} />
          </button>
          <button type="button" className="search-btn" onClick={handleAddItem}>
            <Search size={20} />
          </button>
        </div>

        <div className="summary-bubble">
          No <strong>{formattedDate}</strong> você gastará <strong>R$ {totalGeral.toFixed(2).replace('.', ',')}</strong> no <strong>{market}</strong>
        </div>
      </div>

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
                        handleUpdateItem(item.id, 'qty', val);
                      }}
                      onBlur={() => {
                        if (item.qty === '' || Number(item.qty) <= 0) {
                          handleUpdateItem(item.id, 'qty', 1);
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
                    <button className="delete-btn" onClick={() => handleRemoveItem(item.id)}>
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

      {/* Bottom Sheet Modal */}
      {isBottomSheetOpen && createPortal(
        <>
          <div className="bottom-sheet-overlay" onClick={() => setIsBottomSheetOpen(false)}></div>
          <div className="bottom-sheet animate-slide-up-fast">
            <div className="bottom-sheet-header">
              <h3>Buscar Produtos</h3>
              <button className="close-btn" onClick={() => setIsBottomSheetOpen(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="categories-scroll">
              {categories.map(cat => (
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
                          {addedItem && <span className="added-badge">{addedItem.qty}x na lista</span>}
                        </span>
                        <span className="sheet-product-price">R$ {product.price.toFixed(2).replace('.', ',')} (Média)</span>
                      </div>
                      <button className="add-sheet-btn" onClick={() => handleAddFromSheet(product)}>
                        <Plus size={20} />
                      </button>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </>,
        document.getElementById('root')
      )}
    </div>
  );
}
