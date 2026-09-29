import React, { useEffect, useState } from 'react';
import { ArrowRight, Receipt, PiggyBank } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const [shoppingList, setShoppingList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Lógica de cache: limpa a lista se o dia virou
    const lastSaved = localStorage.getItem('shoppingListDate');
    const today = new Date().toLocaleDateString();
    
    if (lastSaved !== today) {
      localStorage.removeItem('shoppingList');
      localStorage.setItem('shoppingListDate', today);
      setShoppingList([]);
    } else {
      const savedList = localStorage.getItem('shoppingList');
      if (savedList) setShoppingList(JSON.parse(savedList));
    }
  }, []);

  return (
    <div className="page-container animate-slide-up">
      {/* Main Action Card */}
      <div className="main-card" onClick={() => navigate('/estimate')} style={{ cursor: 'pointer' }}>
        <div className="card-content">
          <div className="icon-group">
            <span className="emoji-icon">🛒</span>
            <span className="emoji-icon">📝</span>
          </div>
          <div className="text-content">
            <h2>Estimar<br/>Próxima<br/>Compra</h2>
            <p>Faça sua lista e preveja o gasto.</p>
          </div>
        </div>
        <div className="arrow-container">
          <ArrowRight size={32} color="white" />
        </div>
      </div>

      {/* Event Planning Card */}
      <div className="main-card event-theme" onClick={() => navigate('/event')} style={{ cursor: 'pointer' }}>
        <div className="card-content">
          <div className="icon-group">
            <span className="emoji-icon">🎉</span>
            <span className="emoji-icon">📅</span>
          </div>
          <div className="text-content">
            <h2>Planejamento<br/>de Evento</h2>
            <p>Organize festas e calcule os custos.</p>
          </div>
        </div>
        <div className="arrow-container">
          <ArrowRight size={32} color="white" />
        </div>
      </div>

      {/* Quick Summary */}
      <div className="summary-section">
        <h3 className="section-title">Quick Summary</h3>
        
        <div className="summary-cards">
          <div className="summary-card">
            <div className="icon-wrapper">
              <Receipt size={24} color="var(--text-light)" />
            </div>
            <div className="summary-info">
              <span className="summary-label">Última Compra:</span>
              <span className="summary-value">R$ 145,50</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="icon-wrapper">
              <PiggyBank size={24} color="var(--text-light)" />
            </div>
            <div className="summary-info">
              <span className="summary-label">Total do Mês:</span>
              <span className="summary-value">R$ 420,00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
