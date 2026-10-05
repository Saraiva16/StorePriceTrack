import React, { useState, useEffect } from 'react';
import { ShoppingCart, CheckCircle, CalendarDays, Plus, Loader2 } from 'lucide-react';
import { fetchActiveCart, addItemToCart, closeCart } from '../services/ShoppingListService';
import { fetchProducts } from '../services/EstimateService';
import './ShoppingCart.css';

export default function ShoppingCartPage() {
    const [cart, setCart] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [cartData, productsData] = await Promise.all([
                fetchActiveCart(),
                fetchProducts()
            ]);
            setCart(cartData);
            setProducts(productsData);
            if (productsData.length > 0) setSelectedProduct(productsData[0].id);
        } catch (error) {
            console.error('Failed to load data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async () => {
        if (!selectedProduct || quantity <= 0) return;
        setProcessing(true);
        try {
            const updatedCart = await addItemToCart(selectedProduct, quantity);
            setCart(updatedCart);
        } catch (error) {
            console.error('Failed to add item', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleCloseCart = async () => {
        setProcessing(true);
        try {
            const updatedCart = await closeCart();
            setCart(updatedCart);
        } catch (error) {
            console.error('Failed to close cart', error);
        } finally {
            setProcessing(false);
        }
    };

    const handleReceiptUpload = () => {
        // Implement in Cena 2
        alert("Chamando a Cena 2: Upload de Nota");
    };

    if (loading) {
        return (
            <div className="cart-page-loader">
                <Loader2 className="spinner" size={48} />
                <p>Carregando carrinho...</p>
            </div>
        );
    }

    const isClosed = cart?.status === 'CLOSED';
    const suggestedDate = cart?.suggestedBestDate ? new Date(cart.suggestedBestDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }) : null;

    return (
        <div className="cart-page-container">
            <header className="cart-header">
                <h1>Planejar Próxima Compra</h1>
                <p>Adicione itens e descubra o melhor dia para economizar.</p>
            </header>

            {isClosed && suggestedDate && (
                <div className="best-date-card slide-down">
                    <div className="best-date-icon-wrapper">
                        <CalendarDays size={32} />
                    </div>
                    <div className="best-date-info">
                        <h3>Melhor data sugerida</h3>
                        <p>Baseado no histórico de preços dos itens, a melhor data para compra é na <strong>{suggestedDate}</strong>.</p>
                    </div>
                </div>
            )}

            <div className="cart-main-content">
                <div className="add-item-section card glass">
                    <h2>Adicionar ao Carrinho</h2>
                    <div className="add-item-controls">
                        <select 
                            value={selectedProduct} 
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            className="modern-select"
                        >
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} - {p.category}</option>
                            ))}
                        </select>
                        <input 
                            type="number" 
                            min="1" 
                            value={quantity} 
                            onChange={(e) => setQuantity(Number(e.target.value))}
                            className="modern-input"
                        />
                        <button 
                            onClick={handleAddItem} 
                            disabled={processing || isClosed}
                            className="btn-add-item"
                        >
                            <Plus size={20} />
                            Adicionar
                        </button>
                    </div>
                </div>

                <div className="cart-list-section card glass">
                    <h2>Seu Carrinho</h2>
                    {(!cart?.items || cart.items.length === 0) ? (
                        <div className="empty-cart">
                            <ShoppingCart size={48} className="empty-icon" />
                            <p>Seu carrinho está vazio.</p>
                        </div>
                    ) : (
                        <ul className="cart-item-list">
                            {cart.items.map(item => (
                                <li key={item.id} className="cart-item">
                                    <div className="item-details">
                                        <span className="item-name">{item.product.normalizedName}</span>
                                        <span className="item-category">{item.product.category?.name || 'Outros'}</span>
                                    </div>
                                    <div className="item-quantity">
                                        Qtd: {item.quantity}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="cart-actions">
                        {!isClosed ? (
                            <button 
                                className={`btn-close-cart ${cart?.items?.length === 0 ? 'disabled' : ''}`}
                                onClick={handleCloseCart}
                                disabled={processing || !cart?.items || cart.items.length === 0}
                            >
                                {processing ? <Loader2 className="spinner" size={20} /> : <ShoppingCart size={20} />}
                                <span>Fechar carrinho?</span>
                            </button>
                        ) : (
                            <button 
                                className="btn-finish-purchase pulse-animation"
                                onClick={handleReceiptUpload}
                            >
                                <CheckCircle size={20} />
                                <span>Compra já realizada!</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
