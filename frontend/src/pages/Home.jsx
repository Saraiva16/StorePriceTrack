import React, { useEffect, useState } from 'react';
import { ArrowRight, Receipt, PiggyBank, Pencil, User, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthContext';
import NotificationBell from '../components/NotificationBell/NotificationBell';
import './Home.css';

const DEFAULT_CARDS_VISIBILITY = {
  finance: true,
  estimate: true,
  event: true,
  trips: true,
  summary: true
};

export default function Home() {
  const [shoppingList, setShoppingList] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const storageKey = user?.id ? `home_visible_cards_${user.id}` : 'home_visible_cards_default';

  const [visibleCards, setVisibleCards] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return { ...DEFAULT_CARDS_VISIBILITY, ...JSON.parse(saved) };
      }
    } catch {
      // Fallback para valores padrão caso ocorra falha de parse
    }
    return DEFAULT_CARDS_VISIBILITY;
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.__stopAllActiveCameraStreams) {
      window.__stopAllActiveCameraStreams();
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setVisibleCards({ ...DEFAULT_CARDS_VISIBILITY, ...JSON.parse(saved) });
      } else {
        setVisibleCards(DEFAULT_CARDS_VISIBILITY);
      }
    } catch {
      setVisibleCards(DEFAULT_CARDS_VISIBILITY);
    }
  }, [storageKey]);

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

  const toggleCardVisibility = (cardKey) => {
    setVisibleCards(prev => {
      const updated = { ...prev, [cardKey]: !prev[cardKey] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (err) {
        console.error('Erro ao salvar preferências de cards:', err);
      }
      return updated;
    });
  };

  const getFirstName = () => {
    if (!user?.username) return 'Visitante';
    return user.username.trim().split(' ')[0];
  };

  return (
    <div className="page-container animate-slide-up">
      {/* Header com saudação e ações */}
      <header className="home-header">
        <div className="home-header-greeting">
          <span className="greeting-text">Olá, <strong>{getFirstName()}</strong></span>
        </div>
        <div className="home-header-actions">
          <NotificationBell />
          <button
            type="button"
            className={`header-action-btn ${isEditing ? 'active' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            title={isEditing ? 'Concluir edição' : 'Editar cards visíveis'}
            aria-label={isEditing ? 'Concluir edição' : 'Editar cards visíveis'}
          >
            {isEditing ? <Check size={20} /> : <Pencil size={20} />}
          </button>
          <button
            type="button"
            className="header-action-btn profile-btn"
            onClick={() => navigate('/profile')}
            title="Meu Perfil"
            aria-label="Meu Perfil"
          >
            <User size={22} />
          </button>
        </div>
      </header>

      {isEditing && (
        <div className="edit-mode-banner">
          <span>Modo de edição: clique no ícone para ocultar ou exibir cada card.</span>
        </div>
      )}

      {/* Financial Control Card */}
      {(visibleCards.finance || isEditing) && (
        <div
          className={`main-card finance-theme ${!visibleCards.finance && isEditing ? 'card-disabled' : ''}`}
          onClick={() => !isEditing && navigate('/finance')}
          style={{ cursor: isEditing ? 'default' : 'pointer' }}
        >
          {isEditing && (
            <button
              type="button"
              className="card-visibility-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleCardVisibility('finance');
              }}
              aria-label={visibleCards.finance ? 'Ocultar card financeiro' : 'Exibir card financeiro'}
            >
              {visibleCards.finance ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          )}
          <div className="card-content">
            <div className="icon-group">
              <span className="emoji-icon">💰</span>
              <span className="emoji-icon">📈</span>
            </div>
            <div className="text-content">
              <h2>Controle<br/>Financeiro</h2>
              <p>Gerencie despesas, receitas e faturas de cartão.</p>
            </div>
          </div>
          {!isEditing && (
            <div className="arrow-container">
              <ArrowRight size={32} color="white" />
            </div>
          )}
        </div>
      )}

      {/* Main Action Card */}
      {(visibleCards.estimate || isEditing) && (
        <div
          className={`main-card ${!visibleCards.estimate && isEditing ? 'card-disabled' : ''}`}
          onClick={() => !isEditing && navigate('/estimate')}
          style={{ cursor: isEditing ? 'default' : 'pointer' }}
        >
          {isEditing && (
            <button
              type="button"
              className="card-visibility-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleCardVisibility('estimate');
              }}
              aria-label={visibleCards.estimate ? 'Ocultar card de compras' : 'Exibir card de compras'}
            >
              {visibleCards.estimate ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          )}
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
          {!isEditing && (
            <div className="arrow-container">
              <ArrowRight size={32} color="white" />
            </div>
          )}
        </div>
      )}

      {/* Event Planning Card */}
      {(visibleCards.event || isEditing) && (
        <div
          className={`main-card event-theme ${!visibleCards.event && isEditing ? 'card-disabled' : ''}`}
          onClick={() => !isEditing && navigate('/event')}
          style={{ cursor: isEditing ? 'default' : 'pointer' }}
        >
          {isEditing && (
            <button
              type="button"
              className="card-visibility-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleCardVisibility('event');
              }}
              aria-label={visibleCards.event ? 'Ocultar card de evento' : 'Exibir card de evento'}
            >
              {visibleCards.event ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          )}
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
          {!isEditing && (
            <div className="arrow-container">
              <ArrowRight size={32} color="white" />
            </div>
          )}
        </div>
      )}

      {/* Travel Planning Card */}
      {(visibleCards.trips || isEditing) && (
        <div
          className={`main-card travel-theme ${!visibleCards.trips && isEditing ? 'card-disabled' : ''}`}
          onClick={() => !isEditing && navigate('/trips')}
          style={{ cursor: isEditing ? 'default' : 'pointer' }}
        >
          {isEditing && (
            <button
              type="button"
              className="card-visibility-toggle"
              onClick={(e) => {
                e.stopPropagation();
                toggleCardVisibility('trips');
              }}
              aria-label={visibleCards.trips ? 'Ocultar card de viagem' : 'Exibir card de viagem'}
            >
              {visibleCards.trips ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          )}
          <div className="card-content">
            <div className="icon-group">
              <span className="emoji-icon">✈️</span>
              <span className="emoji-icon">🌴</span>
            </div>
            <div className="text-content">
              <h2>Planejando<br/>nova viagem</h2>
              <p>Lista de mercado e divisão de gastos com amigos.</p>
            </div>
          </div>
          {!isEditing && (
            <div className="arrow-container">
              <ArrowRight size={32} color="white" />
            </div>
          )}
        </div>
      )}

      {/* Quick Summary */}
      {(visibleCards.summary || isEditing) && (
        <div className={`summary-section ${!visibleCards.summary && isEditing ? 'summary-disabled' : ''}`}>
          <div className="summary-section-header">
            <h3 className="section-title">Quick Summary</h3>
            {isEditing && (
              <button
                type="button"
                className="card-visibility-toggle inline"
                onClick={() => toggleCardVisibility('summary')}
                aria-label={visibleCards.summary ? 'Ocultar quick summary' : 'Exibir quick summary'}
              >
                {visibleCards.summary ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            )}
          </div>
          
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
      )}
    </div>
  );
}
