import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Edit2, Check, Flame, Utensils, Calendar, ChevronDown, ChevronUp, Beer, Users, Plus, Minus, Trash2, DownloadCloud } from 'lucide-react';
import PostEventWizard from '../components/PostEventWizard';
import './EventDashboard.css';

export default function EventDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const eventData = location.state?.eventData;

  const [estimates, setEstimates] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showTooltip, setShowTooltip] = useState(null);

  // Task 5 States
  const [eventState, setEventState] = useState('pending'); // pending, running, feedback
  const [timerSeconds, setTimerSeconds] = useState(eventData ? (eventData.duration || 4) * 3600 : 0);

  // Task 4 States
  const [isDrinksExpanded, setIsDrinksExpanded] = useState(false);
  const [isStaffExpanded, setIsStaffExpanded] = useState(false);

  const [selectedDrinks, setSelectedDrinks] = useState({
    beer: true,
    soda: true,
    water: true,
    juice: false
  });

  const [staffList, setStaffList] = useState([
    { id: 1, role: 'Churrasqueiro', quantity: 1 },
    { id: 2, role: 'Garçom', quantity: 1 },
    { id: 3, role: 'Limpeza', quantity: 1 }
  ]);

  useEffect(() => {
    if (!eventData) {
      navigate('/home');
      return;
    }
    calculateEstimates(eventData);
  }, [eventData, navigate]);

  useEffect(() => {
    let interval;
    if (eventState === 'running') {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [eventState]);

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return "00:00:00";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const toggleDrink = (key) => {
    setSelectedDrinks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateStaff = (id, increment) => {
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        const newQtd = s.quantity + increment;
        return { ...s, quantity: newQtd < 0 ? 0 : newQtd };
      }
      return s;
    }));
  };

  const calculateDrinks = () => {
    if (!eventData) return [];
    const { guests } = eventData;
    const adults = guests.men + guests.women;
    const kids = guests.kids;
    const totalPeople = adults + kids;
    
    const drinks = [];
    if (selectedDrinks.beer) {
      drinks.push({ id: 'beer', title: 'Cerveja', value: Math.ceil(adults * 1.5), unit: 'L', rule: '1.5L por adulto' });
    }
    if (selectedDrinks.soda) {
      drinks.push({ id: 'soda', title: 'Refrigerante', value: Math.ceil((adults * 0.5) + (kids * 1)), unit: 'L', rule: '500ml p/ adulto + 1L p/ criança' });
    }
    if (selectedDrinks.water) {
      drinks.push({ id: 'water', title: 'Água', value: Math.ceil(totalPeople * 0.5), unit: 'L', rule: '500ml por pessoa' });
    }
    if (selectedDrinks.juice) {
      drinks.push({ id: 'juice', title: 'Suco', value: Math.ceil(kids * 0.8), unit: 'L', rule: '800ml por criança' });
    }
    return drinks;
  };

  const handleStartEvent = () => {
    setEventState('running');
    setIsDrinksExpanded(false);
    setIsStaffExpanded(false);
  };

  if (!eventData) return null;

  return (
    <>
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

          {/* Drinks Accordion */}
          <section className="accordion-section">
            <div className="accordion-header" onClick={() => setIsDrinksExpanded(!isDrinksExpanded)}>
              <div className="accordion-title">
                <div className="estimate-icon">
                  <Beer size={20} />
                </div>
                <h3>Bebidas</h3>
              </div>
              {isDrinksExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            {isDrinksExpanded && (
              <div className="accordion-content animate-slide-up">
                <div className="drinks-selector">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={selectedDrinks.beer} onChange={() => toggleDrink('beer')} /> Cerveja
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={selectedDrinks.soda} onChange={() => toggleDrink('soda')} /> Refri
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={selectedDrinks.water} onChange={() => toggleDrink('water')} /> Água
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={selectedDrinks.juice} onChange={() => toggleDrink('juice')} /> Suco
                  </label>
                </div>

                <div className="drinks-estimates">
                  {calculateDrinks().map(drink => (
                    <div key={drink.id} className="drink-card">
                      <div className="drink-info">
                        <h4>{drink.title}</h4>
                        <span className="drink-rule">{drink.rule}</span>
                      </div>
                      <div className="drink-value">
                        <span className="val">{drink.value}</span>
                        <span className="unt">{drink.unit}</span>
                      </div>
                    </div>
                  ))}
                  {calculateDrinks().length === 0 && <p className="empty-text">Nenhuma bebida selecionada.</p>}
                </div>
              </div>
            )}
          </section>

          {/* Staff Accordion - Only for Social Events */}
          {eventData.eventType === 'Social' && (
            <section className="accordion-section">
              <div className="accordion-header" onClick={() => setIsStaffExpanded(!isStaffExpanded)}>
                <div className="accordion-title">
                  <div className="estimate-icon">
                    <Users size={20} />
                  </div>
                  <h3>Equipe & Funcionários</h3>
                </div>
                {isStaffExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
              
              {isStaffExpanded && (
                <div className="accordion-content animate-slide-up">
                  <div className="staff-list">
                    {staffList.map(staff => (
                      <div key={staff.id} className="staff-item">
                        <span className="staff-role">{staff.role}</span>
                        <div className="counter-widget">
                          <button onClick={() => updateStaff(staff.id, -1)} className="counter-btn" disabled={staff.quantity === 0}>
                            <Minus size={14} />
                          </button>
                          <span className="counter-val">{staff.quantity}</span>
                          <button onClick={() => updateStaff(staff.id, 1)} className="counter-btn">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="add-staff-btn">
                    <Plus size={16} /> Adicionar Função
                  </button>
                </div>
              )}
            </section>
          )}

          {/* PDF Download Card */}
          <div className="pdf-download-card">
            <div className="pdf-icon-bg">
              <DownloadCloud size={28} color="#ffffff" />
            </div>
            <div className="pdf-content">
              <h4>Lista de Compras Pronta</h4>
              <p>Baixe o PDF com as quantidades exatas para o mercado.</p>
            </div>
            <button className="pdf-btn" onClick={() => alert('PDF Baixado com sucesso!')}>
              Baixar
            </button>
          </div>

        </div>
      </section>

        {eventState === 'pending' && (
          <div className="start-event-footer">
            <button className="btn-primary start-btn" onClick={handleStartEvent}>
              Começar Evento 🎉
            </button>
          </div>
        )}
      </div>

      {eventState === 'running' && (
        <div className="active-event-bar animate-slide-up">
          <div className="timer-display">
            <div className="pulsing-dot"></div>
            <span className="time-text">{formatTime(timerSeconds)}</span>
          </div>
          <button className="finish-btn" onClick={() => setEventState('feedback')}>
            Finalizar
          </button>
        </div>
      )}

      {eventState === 'feedback' && (
        <PostEventWizard 
          onClose={() => navigate('/home')} 
          eventData={eventData}
          estimates={estimates}
        />
      )}
    </>
  );
}
