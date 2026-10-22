import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, Search, Plus, Minus, Trash2, Filter, X, ShoppingCart, CheckCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchNetworks, fetchProducts, recalculatePrices, createProduct } from '../services/EstimateService';
import { addItemToCart, closeCart, uploadReceipt, getComparisonReport } from '../services/ShoppingListService';
import { 
  fetchTripShoppingItems, 
  addTripShoppingItem, 
  updateTripShoppingItem, 
  deleteTripShoppingItem, 
  clearTripShoppingItems 
} from '../services/TripShoppingService';
import { parseCurrencyToNumber } from '../utils/currency';
import ProductsTable from '../components/ProductsTable/ProductsTable';
import BottomSheet from '../components/BottomSheet/BottomSheet';
import ReceiptUploadSheet from '../components/BottomSheet/ReceiptUploadSheet';
import './EstimatePurchase.css';

export default function EstimatePurchase() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tripId = location.state?.tripId || queryParams.get('tripId');
  const tripDestination = location.state?.tripDestination || queryParams.get('tripDestination');
  const todayISO = new Date().toISOString().split('T')[0];
  const [market, setMarket] = useState('');
  const [marketsList, setMarketsList] = useState([]);
  const [date, setDate] = useState(todayISO);
  const [newProduct, setNewProduct] = useState('');
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isReceiptSheetOpen, setIsReceiptSheetOpen] = useState(false);
  const [comparisonReport, setComparisonReport] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [cartId, setCartId] = useState(null);
  const [savingsPercentage, setSavingsPercentage] = useState(null);
  
  const [categories, setCategories] = useState(['Todos']);
  const [productsList, setProductsList] = useState([]);
  const [items, setItems] = useState([]);
  const [estimatesFetchedFor, setEstimatesFetchedFor] = useState('');

  const [cartClosed, setCartClosed] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState(null);
  const [processingCart, setProcessingCart] = useState(false);

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
          if (item.isCustomPrice && item.unitPrice > 0) {
            return item;
          }
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

  const totalGeral = items.reduce((acc, item) => {
    const qty = Number(item?.qty) || 0;
    const price = Number(item?.unitPrice) || 0;
    return acc + (qty * price);
  }, 0);

  const invalidateCartState = () => {
    if (cartClosed) {
      setCartClosed(false);
      setSuggestedDate(null);
    }
  };

  const handleAddItem = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newProduct.trim();
    if (!trimmed) return;
    invalidateCartState();
    
    let matched = productsList.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (!matched) {
      const created = await createProduct({ normalizedName: trimmed });
      if (created && created.id) {
        matched = {
          id: created.id,
          name: created.normalizedName || trimmed,
          category: created.categoryName || 'Outros',
          price: 0.00
        };
        setProductsList(prev => [...prev, matched]);
      }
    }

    if (tripId) {
      try {
        const savedDto = await addTripShoppingItem(tripId, {
          name: matched ? matched.name : trimmed,
          quantity: 1,
          unitPrice: matched ? matched.price : 0.00,
          category: matched ? matched.category : 'Outros',
          isCustomPrice: false
        });

        const newItem = {
          id: savedDto.id,
          name: savedDto.name,
          qty: Number(savedDto.quantity) || 1,
          unitPrice: Number(savedDto.unitPrice) || 0.00,
          category: savedDto.category,
          isCustomPrice: savedDto.isCustomPrice,
          addedByName: savedDto.addedByName
        };

        setItems(prev => {
          const idx = prev.findIndex(i => i.id === savedDto.id || i.name.toLowerCase() === savedDto.name.toLowerCase());
          if (idx >= 0) {
            return prev.map((it, i) => i === idx ? newItem : it);
          }
          return [...prev, newItem];
        });
        setNewProduct('');
        return;
      } catch (err) {
        console.error("Erro ao salvar item na viagem:", err);
      }
    }

    const existing = items.find(i => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleUpdateItem(existing.id, 'qty', (Number(existing.qty) || 0) + 1);
    } else {
      const newItem = {
        id: matched ? matched.id : Date.now() + Math.random(),
        name: matched ? matched.name : trimmed,
        qty: 1,
        unitPrice: matched ? matched.price : 0.00,
        category: matched ? matched.category : 'Outros'
      };
      setItems(prev => [...prev, newItem]);
    }

    setNewProduct('');
  };

  const handleAddCustomProduct = async ({ name, price, qty = 1, category = 'Outros' }) => {
    invalidateCartState();
    const cleanPrice = typeof price === 'number' ? price : parseCurrencyToNumber(price);
    const cleanQty = Math.max(1, Number(qty) || 1);
    const trimmed = name.trim();

    let matched = productsList.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (!matched) {
      const created = await createProduct({ normalizedName: trimmed });
      if (created && created.id) {
        matched = {
          id: created.id,
          name: created.normalizedName || trimmed,
          category: created.categoryName || category,
          price: cleanPrice
        };
        setProductsList(prev => [...prev, matched]);
      }
    }

    if (tripId) {
      try {
        const savedDto = await addTripShoppingItem(tripId, {
          name: matched ? matched.name : trimmed,
          quantity: cleanQty,
          unitPrice: cleanPrice,
          category: matched ? matched.category : category,
          isCustomPrice: cleanPrice > 0
        });

        const newItem = {
          id: savedDto.id,
          name: savedDto.name,
          qty: Number(savedDto.quantity) || cleanQty,
          unitPrice: Number(savedDto.unitPrice) || cleanPrice,
          category: savedDto.category,
          isCustomPrice: savedDto.isCustomPrice,
          addedByName: savedDto.addedByName
        };

        setItems(prev => {
          const idx = prev.findIndex(i => i.id === savedDto.id || i.name.toLowerCase() === savedDto.name.toLowerCase());
          if (idx >= 0) {
            return prev.map((it, i) => i === idx ? newItem : it);
          }
          return [...prev, newItem];
        });
        return;
      } catch (err) {
        console.error("Erro ao salvar item customizado na viagem:", err);
      }
    }

    const existing = items.find(i => i.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      handleUpdateItem(existing.id, {
        qty: (Number(existing.qty) || 0) + cleanQty,
        ...(cleanPrice > 0 ? { unitPrice: cleanPrice, isCustomPrice: true } : {})
      });
      return;
    }

    const newItem = {
      id: matched ? matched.id : Date.now() + Math.random(),
      name: matched ? matched.name : trimmed,
      qty: cleanQty,
      unitPrice: cleanPrice,
      isCustomPrice: cleanPrice > 0,
      category: matched ? matched.category : category
    };

    setItems(prev => [...prev, newItem]);
  };

  const handleAddFromSheet = async (product) => {
    invalidateCartState();
    if (tripId) {
      try {
        const savedDto = await addTripShoppingItem(tripId, {
          name: product.name,
          quantity: 1,
          unitPrice: product.price || 0.00,
          category: product.category,
          isCustomPrice: false
        });

        const newItem = {
          id: savedDto.id,
          name: savedDto.name,
          qty: Number(savedDto.quantity) || 1,
          unitPrice: Number(savedDto.unitPrice) || 0.00,
          category: savedDto.category,
          isCustomPrice: savedDto.isCustomPrice,
          addedByName: savedDto.addedByName
        };

        setItems(prev => {
          const idx = prev.findIndex(i => i.id === savedDto.id || i.name.toLowerCase() === savedDto.name.toLowerCase());
          if (idx >= 0) {
            return prev.map((it, i) => i === idx ? newItem : it);
          }
          return [...prev, newItem];
        });
        return;
      } catch (err) {
        console.error("Erro ao adicionar produto da lista na viagem:", err);
      }
    }

    const existing = items.find(i => i.name === product.name);
    if (existing) {
      handleUpdateItem(existing.id, 'qty', (Number(existing.qty) || 0) + 1);
    } else {
      const newItem = {
        id: Date.now() + Math.random(),
        name: product.name,
        qty: 1,
        unitPrice: product.price || 0.00,
        category: product.category
      };
      setItems(prev => [...prev, newItem]);
    }
  };

  const handleRemoveFromSheet = (product) => {
    invalidateCartState();
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
    invalidateCartState();
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    if (tripId) {
      deleteTripShoppingItem(tripId, id)
        .catch(err => console.error("Erro ao remover item da viagem:", err));
    }
  };

  const handleUpdateItem = (id, fieldOrObj, value) => {
    invalidateCartState();
    let updatedItem = null;
    setItems(prevItems => prevItems.map(item => {
      if (item.id === id) {
        if (typeof fieldOrObj === 'object' && fieldOrObj !== null) {
          updatedItem = { ...item, ...fieldOrObj };
        } else {
          updatedItem = { ...item, [fieldOrObj]: value };
        }
        return updatedItem;
      }
      return item;
    }));

    if (tripId && updatedItem) {
      updateTripShoppingItem(tripId, id, {
        name: updatedItem.name,
        quantity: updatedItem.qty,
        unitPrice: updatedItem.unitPrice,
        category: updatedItem.category,
        isCustomPrice: updatedItem.isCustomPrice,
        checked: updatedItem.checked
      }).catch(err => console.error("Erro ao atualizar item da viagem no backend:", err));
    }
  };

  // Carregamento inicial de itens: Viagem (Backend) vs Pessoal (LocalStorage)
  useEffect(() => {
    if (tripId) {
      fetchTripShoppingItems(tripId)
        .then(tripItems => {
          if (Array.isArray(tripItems)) {
            const mapped = tripItems.map(ti => ({
              id: ti.id,
              name: ti.name,
              qty: Number(ti.quantity) || 1,
              unitPrice: Number(ti.unitPrice) || 0,
              category: ti.category || 'Outros',
              isCustomPrice: ti.isCustomPrice ?? true,
              checked: Boolean(ti.checked),
              addedByName: ti.addedByName
            }));
            setItems(mapped);
          }
        })
        .catch(err => {
          console.error("Erro ao carregar lista de compras da viagem", err);
          const saved = localStorage.getItem(`estimate_cart_items_trip_${tripId}`);
          if (saved) {
            try {
              setItems(JSON.parse(saved));
            } catch (e) {}
          }
        });
    } else {
      const saved = localStorage.getItem('estimate_cart_items_personal') || localStorage.getItem('estimate_cart_items');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const validItems = parsed.filter(item => item && item.id && item.name);
            setItems(validItems);
          }
        } catch (e) {
          console.error("Erro ao carregar lista pessoal", e);
        }
      }
    }
  }, [tripId]);

  // Salva no localStorage separado para evitar colisão entre lista pessoal e lista de viagem
  useEffect(() => {
    if (tripId) {
      localStorage.setItem(`estimate_cart_items_trip_${tripId}`, JSON.stringify(items));
    } else {
      localStorage.setItem('estimate_cart_items_personal', JSON.stringify(items));
    }
  }, [items, tripId]);

  const [tripCheckoutSummary, setTripCheckoutSummary] = useState(null);

  const handleCloseCart = async () => {
    if (items.length === 0) return;
    setProcessingCart(true);

    // FLUXO A: LISTA DE COMPRAS DA VIAGEM
    if (tripId) {
      try {
        // 1. Marca todos os itens como comprados/conferidos (checked = true)
        const updatedItems = items.map(it => ({ ...it, checked: true }));
        setItems(updatedItems);

        // Atualiza no backend em paralelo
        await Promise.all(
          items.map(it => 
            updateTripShoppingItem(tripId, it.id, {
              name: it.name,
              quantity: it.qty,
              unitPrice: it.unitPrice,
              category: it.category,
              isCustomPrice: it.isCustomPrice,
              checked: true
            }).catch(e => console.warn("Erro ao marcar item no fechamento:", e))
          )
        );

        setCartClosed(true);
        // Prepara resumo para rateio
        setTripCheckoutSummary({
          total: totalGeral,
          itemCount: items.length,
          date: date || todayISO
        });
      } catch (error) {
        console.error("Falha ao fechar lista da viagem", error);
        alert("Erro ao fechar a lista da viagem.");
      } finally {
        setProcessingCart(false);
      }
      return;
    }

    // FLUXO B: ESTIMATIVA PESSOAL (PREVISÃO DE COMPRA DOMÉSTICA)
    try {
      // Match items with real product IDs
      for (const item of items) {
        const productMatch = productsList.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        if (productMatch && productMatch.id) {
          await addItemToCart(productMatch.id, item.qty);
        }
      }

      const closedCartData = await closeCart();
      if (closedCartData) {
        setCartId(closedCartData.id);
        const bestDateRaw = closedCartData.suggestedBestDate || closedCartData.suggested_best_date;
        if (bestDateRaw) {
          const dateObj = new Date(bestDateRaw);
          setSuggestedDate(dateObj.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }));
        }

        const savingsRaw = closedCartData.suggestedSavingsPercentage || closedCartData.suggested_savings_percentage;
        if (savingsRaw && Number(savingsRaw) > 0) {
          setSavingsPercentage(Number(savingsRaw).toFixed(0));
        }
      }
      setCartClosed(true);
    } catch (error) {
      console.error("Failed to close cart", error);
      alert("Erro ao fechar o carrinho. Tente novamente.");
    } finally {
      setProcessingCart(false);
    }
  };

  const handleReceiptUpload = () => {
    setIsReceiptSheetOpen(true);
  };

  const handleUploadProcess = async (file) => {
    try {
      // 1. Upload receipt
      const receiptRes = await uploadReceipt(file);
      
      if (!receiptRes || !receiptRes.id) {
        throw new Error("Nota fiscal processada mas ID não retornado.");
      }

      // 2. Compare with current cart
      if (cartId) {
        const report = await getComparisonReport(cartId, receiptRes.id);
        setComparisonReport(report);
      } else {
        alert("Carrinho não encontrado para comparação.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro no processamento da nota ou comparação: " + e.message);
    }
  };

  const handleClearTable = () => {
    if (window.confirm("Tem certeza que deseja limpar a tabela inteira?")) {
      setItems([]);
      setCartClosed(false);
      setCartId(null);
      setComparisonReport(null);
      setSuggestedDate('');
      setSavingsPercentage(null);
      if (tripId) {
        clearTripShoppingItems(tripId)
          .catch(err => console.error("Erro ao limpar lista da viagem no backend:", err));
      }
    }
  };

  let formattedDate = '';
  try {
    if (date) {
      formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  } catch (e) {
    formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return (
    <div className="page-container animate-slide-up estimate-page">
      <div className="header-bar">
        <button className="icon-btn" onClick={() => tripId ? navigate(`/trips/${tripId}`) : navigate('/home')}>
          <ChevronLeft size={28} />
        </button>
        <h2>{tripId ? 'Lista da Viagem' : 'Estimativa Pessoal'}</h2>
        <div style={{ width: 28 }}></div>
      </div>

      {tripId && (
        <div style={{
          backgroundColor: '#e6f7f4',
          border: '1px solid #2a9d8f',
          borderRadius: '14px',
          padding: '12px 14px',
          marginBottom: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontSize: '13px',
          color: '#264653'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '14px' }}>
            <span style={{ fontSize: '16px' }}>✈️</span>
            <span>Lista compartilhada para: <strong>{tripDestination || 'Viagem'}</strong></span>
          </div>
          <div style={{ color: '#52796f', fontSize: '12px' }}>
            👥 Todos os amigos desta viagem podem visualizar e colaborar nesta lista em tempo real.
          </div>
        </div>
      )}

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

        {/* CENA 1 - BEST DATE CARD (PESSOAL) */}
        {!tripId && cartClosed && suggestedDate && (
          <div className="best-date-card slide-down" style={{ marginTop: '1rem', marginBottom: '0' }}>
              <div className="best-date-icon-wrapper" style={{ padding: '0.6rem' }}>
                  <Search size={20} color="#fff" />
              </div>
              <div className="best-date-info">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>Melhor data sugerida</h3>
                  <p style={{ fontSize: '0.9rem' }}>
                    A melhor data para compra é <strong>{suggestedDate}</strong>.
                    {savingsPercentage && savingsPercentage > 0 && (
                      <span style={{ display: 'block', marginTop: '4px', color: '#1e272e', fontWeight: 'bold' }}>
                        Você pode economizar até {savingsPercentage}%
                      </span>
                    )}
                  </p>
              </div>
          </div>
        )}

        {/* CENA 2 - CHECKOUT DA VIAGEM: ATALHO PARA DIVIDIR GASTOS */}
        {tripId && cartClosed && (
          <div className="best-date-card slide-down" style={{ marginTop: '1rem', marginBottom: '0', background: 'linear-gradient(135deg, #2a9d8f 0%, #264653 100%)', color: 'white' }}>
              <div className="best-date-icon-wrapper" style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.2)' }}>
                  <CheckCircle size={22} color="#fff" />
              </div>
              <div className="best-date-info" style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '4px', color: 'white' }}>Lista de Compras Finalizada!</h3>
                  <p style={{ fontSize: '0.88rem', color: '#e0f2f1' }}>
                    Todos os itens foram marcados como concluídos. Total estimado: <strong>R$ {totalGeral.toFixed(2).replace('.', ',')}</strong>.
                  </p>
                  <button 
                    onClick={() => navigate(`/trips/${tripId}/expenses`, { state: { prefillDescription: `Mercado (${market || 'Compras da Viagem'})`, prefillAmount: totalGeral } })}
                    style={{ marginTop: '10px', padding: '10px 16px', background: '#e07a5f', color: 'white', border: 'none', borderRadius: '50px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  >
                    <span>💸 Lançar no Dividir Gastos</span>
                  </button>
              </div>
          </div>
        )}
      </div>

      <ProductsTable 
        items={items} 
        onUpdateItem={handleUpdateItem} 
        onRemoveItem={handleRemoveItem} 
      />

      {/* CENA 1 - ACTION BUTTONS */}
      <div className="cart-actions-wrapper" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '1rem', paddingBottom: '2rem' }}>
        {items.length > 0 && (
           <button 
              className="btn-clear-cart"
              onClick={handleClearTable}
              style={{ padding: '1rem', borderRadius: '50px', background: '#f1f2f6', color: '#57606f', border: '1px solid #dfe4ea', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
              title="Limpar tabela"
           >
              <Trash2 size={20} />
           </button>
        )}

        {!cartClosed ? (
          <button 
              className={`btn-close-cart ${items.length === 0 ? 'disabled' : ''}`}
              onClick={handleCloseCart}
              disabled={processingCart || items.length === 0}
              style={{ padding: '1rem 2rem', borderRadius: '50px', background: '#ff4757', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center', cursor: items.length > 0 ? 'pointer' : 'not-allowed', transition: 'all 0.3s', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
          >
              <ShoppingCart size={20} />
              <span>{processingCart ? 'Calculando...' : 'Fechar carrinho?'}</span>
          </button>
        ) : (
          <button 
              className="btn-finish-purchase pulse-green-btn"
              onClick={handleReceiptUpload}
              style={{ padding: '1rem 2rem', borderRadius: '50px', background: '#2ed573', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 15px rgba(46, 213, 115, 0.4)' }}
          >
              <CheckCircle size={20} />
              <span>Compra já realizada!</span>
          </button>
        )}
      </div>

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
        onAddCustomProduct={handleAddCustomProduct}
      />

      <ReceiptUploadSheet 
        isOpen={isReceiptSheetOpen}
        onClose={() => setIsReceiptSheetOpen(false)}
        onUpload={handleUploadProcess}
      />

      {comparisonReport && (
        <div className="comparison-report animate-slide-up" style={{ marginTop: '20px', padding: '20px', background: 'var(--card-primary-bg)', borderRadius: 'var(--border-radius-lg)', color: 'white' }}>
          <h3 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '10px' }}>
            Resumo da Compra
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Planejado</p>
              <h4 style={{ fontSize: '1.4rem' }}>R$ {comparisonReport.totalEstimated.toFixed(2).replace('.', ',')}</h4>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px', borderRadius: '12px' }}>
              <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Total Gasto</p>
              <h4 style={{ fontSize: '1.4rem' }}>R$ {comparisonReport.totalActual.toFixed(2).replace('.', ',')}</h4>
            </div>
          </div>

          <div style={{ background: 'white', color: 'var(--text-dark)', borderRadius: '12px', padding: '15px' }}>
            <h4 style={{ marginBottom: '10px', color: '#1e90ff' }}>Itens mais caros que o esperado:</h4>
            {comparisonReport.itemsMoreExpensive.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {comparisonReport.itemsMoreExpensive.map(item => (
                  <li key={item.productName} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #f1f2f6', paddingBottom: '4px' }}>
                    <span>{item.productName}</span>
                    <span style={{ color: '#ff4757', fontWeight: 'bold' }}>+{((item.actualPrice - item.estimatedPrice)/item.estimatedPrice * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Nenhum item ficou mais caro!</p>
            )}

            <h4 style={{ marginTop: '15px', marginBottom: '10px', color: '#2ed573' }}>Itens mais baratos que o esperado:</h4>
            {comparisonReport.itemsCheaper.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {comparisonReport.itemsCheaper.map(item => (
                  <li key={item.productName} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #f1f2f6', paddingBottom: '4px' }}>
                    <span>{item.productName}</span>
                    <span style={{ color: '#2ed573', fontWeight: 'bold' }}>-{((item.estimatedPrice - item.actualPrice)/item.estimatedPrice * 100).toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#666' }}>Nenhum item ficou mais barato.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
