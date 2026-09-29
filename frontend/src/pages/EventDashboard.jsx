import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Edit2, Check, Flame, Utensils, Calendar } from 'lucide-react';
import './EventDashboard.css';

export default function EventDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const eventData = location.state?.eventData;

  const [estimates, setEstimates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(null);

  useEffect(() => {
    if (!eventData) {
      navigate('/home');
      return;
    }
    calculateEstimates(eventData);
  }, [eventData, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTooltip !== null && !event.target.closest('.tooltip-content') && !event.target.closest('.tooltip-btn')) {
        setShowTooltip(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTooltip]);

  const calculateEstimates = (data) => {
    const { guests, foodType } = data;
    const newEstimates = [];

    if (foodType === 'Churrasco') {
      const meatKg = (guests.men * 0.5) + (guests.women * 0.4) + (guests.kids * 0.2);
      newEstimates.push({
        id: 'meat',
        title: 'Carnes Variadas',
        value: Math.ceil(meatKg * 10) / 10, // Round to 1 decimal
        unit: 'Kg',
        icon: <Utensils size={20} />,
        mathRule: `${guests.men} homens (500g) + ${guests.women} mulheres (400g) + ${guests.kids} crianças (200g)`
      });

      const charcoalKg = meatKg * 1.2;
      newEstimates.push({
        id: 'charcoal',
        title: 'Carvão',
        value: Math.ceil(charcoalKg),
        unit: 'Kg',
        icon: <Flame size={20} />,
        mathRule: `Aproximadamente 1.2Kg de carvão para cada 1Kg de carne.`
      });
    } else if (foodType === 'Pizza') {
      const slices = (guests.men * 4) + (guests.women * 3) + (guests.kids * 2);
      const pizzas = Math.ceil(slices / 8);
      newEstimates.push({
        id: 'pizza',
        title: 'Pizzas (8 Fatias)',
        value: pizzas,
        unit: 'un',
        icon: <Utensils size={20} />,
        mathRule: `${guests.men} homens (4 fatias) + ${guests.women} mulheres (3 fatias) + ${guests.kids} crianças (2 fatias). Total: ${slices} fatias.`
      });
    } else {
      // Generic
      const totalPeople = guests.men + guests.women + guests.kids;
      const genericFood = totalPeople * 0.4;
      newEstimates.push({
        id: 'generic',
        title: 'Comida Principal',
        value: Math.ceil(genericFood * 10) / 10,
        unit: 'Kg',
        icon: <Utensils size={20} />,
        mathRule: `Base padrão de 400g por pessoa (Média geral).`
      });
    }

    setEstimates(newEstimates);
  };

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditValue(item.value);
  };

  const saveEdit = (id) => {
    setEstimates(prev => prev.map(est => 
      est.id === id ? { ...est, value: parseFloat(editValue) || est.value } : est
    ));
    setEditingId(null);
  };

  const toggleTooltip = (id) => {
    setShowTooltip(showTooltip === id ? null : id);
  };

  if (!eventData) return null;

  return (
    <div className="page-container dash-container animate-slide-up">
      <header className="dash-header">
        <button className="icon-btn" onClick={() => navigate('/event')}>
          <ArrowLeft size={24} />
        </button>
        <h2>Dashboard do Evento</h2>
        <div style={{ width: 24 }} />
      </header>

      <div className="event-summary-card">
        <div className="summary-header">
          <h3>{eventData.foodType === 'Outro' ? eventData.customFoodType : eventData.foodType}</h3>
          <div className="event-badge">{eventData.eventType}</div>
        </div>
        <div className="event-meta">
          <span><Calendar size={16} /> {new Date(eventData.date + 'T12:00:00').toLocaleDateString()}</span>
          <span>👥 {eventData.guests.men + eventData.guests.women + eventData.guests.kids} pessoas</span>
        </div>
      </div>

      <section className="estimates-section">
        <div className="section-header">
          <h3>Estimativas (Editáveis)</h3>
          <p>Ajuste as quantidades conforme achar necessário.</p>
        </div>

        <div className="estimates-list">
          {estimates.map(est => (
            <div key={est.id} className="estimate-card">
              <div className="estimate-icon">{est.icon}</div>
              
              <div className="estimate-info">
                <div className="estimate-title-row">
                  <h4>{est.title}</h4>
                  <button className="tooltip-btn" onClick={() => toggleTooltip(est.id)}>
                    <HelpCircle size={16} />
                  </button>
                </div>
                
                {showTooltip === est.id && (
                  <div className="tooltip-content animate-slide-up">
                    <strong>Como calculamos?</strong>
                    <p>{est.mathRule}</p>
                  </div>
                )}
              </div>

              <div className="estimate-value-box">
                {editingId === est.id ? (
                  <div className="edit-mode">
                    <input 
                      type="number" 
                      value={editValue} 
                      onChange={e => setEditValue(e.target.value)}
                      className="edit-input"
                      autoFocus
                    />
                    <button className="save-btn" onClick={() => saveEdit(est.id)}>
                      <Check size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="view-mode" onClick={() => startEditing(est)}>
                    <span className="value">{est.value}</span>
                    <span className="unit">{est.unit}</span>
                    <Edit2 size={14} className="edit-icon" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Task 4 Placeholders */}
      <section className="coming-soon-section">
        <h3>+ Adicionar Bebidas</h3>
        <p>A gestão de bebidas e funcionários será feita aqui em breve (Task 4).</p>
      </section>

      <div className="start-event-footer">
        <button className="btn-primary start-btn">
          Começar Evento 🎉
        </button>
      </div>
    </div>
  );
}
