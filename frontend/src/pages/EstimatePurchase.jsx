import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Search, Plus, Minus, Trash2, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchNetworks, fetchProducts, recalculatePrices } from '../services/EstimateService';
import ProductsTable from '../components/ProductsTable/ProductsTable';
import BottomSheet from '../components/BottomSheet/BottomSheet';
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
  const [estimatesFetchedFor, setEstimatesFetchedFor] = useState('');


  useEffect(() => {
    fetchNetworks()
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

    fetchProducts()
      .then(formatted => setProductsList(formatted))
      .catch(err => console.error('Erro ao buscar produtos:', err));
  }, []);

  const dynamicCategories = ['Todos', ...new Set(productsList.map(p => p.category))];

  // Recalcula preços quando o mercado muda ou quando a lista de produtos carrega/muda
  useEffect(() => {
    if (!market || productsList.length === 0) return;
    
    const namesToCalculate = new Set();
    items.forEach(item => namesToCalculate.add(item.name));
    productsList.forEach(p => namesToCalculate.add(p.name));

    recalculatePrices(market, Array.from(namesToCalculate))
      .then(newPrices => {
        setItems(prevItems => prevItems.map(item => {
          if (newPrices[item.name] !== undefined) {
            return { ...item, unitPrice: newPrices[item.name] };
          }
          return item;
        }));
        
        setProductsList(prevProds => prevProds.map(p => {
          if (newPrices[p.name] !== undefined) {
            return { ...p, price: newPrices[p.name] };
          }
          return p;
        }));
      })
      .catch(err => console.error("Erro ao recalcular preços", err));
  }, [market, productsList.length, items.length]);

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

  const handleRemoveFromSheet = (product) => {
    const existing = items.find(i => i.name === product.name);
    if (existing) {
      if (existing.qty > 1) {
        handleUpdateItem(existing.id, 'qty', existing.qty - 1);
      } else {
        handleRemoveItem(existing.id);
      }
    }
  };

  const handleRemoveItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
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

      <ProductsTable 
        items={items} 
        onUpdateItem={handleUpdateItem} 
        onRemoveItem={handleRemoveItem} 
      />

      <BottomSheet 
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        dynamicCategories={dynamicCategories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        productsList={productsList}
        items={items}
        onAddFromSheet={handleAddFromSheet}
        onRemoveFromSheet={handleRemoveFromSheet}
      />
    </div>
  );
}
