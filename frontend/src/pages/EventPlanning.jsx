import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Users, Clock, ShoppingCart, CheckCircle2 } from 'lucide-react';
import './EventPlanning.css';

export default function EventPlanning() {
  const navigate = useNavigate();
  const formContentRef = useRef(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    eventType: '',
    guests: { men: 0, women: 0, kids: 0 },
    foodType: '',
    customFoodType: '',
    date: '',
    duration: 4, // hours
    startTime: '12:00',
    preferredStore: ''
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
      if (formContentRef.current) {
        formContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    else handleFinish();
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigate('/home');
  };

  const handleFinish = () => {
    // In the future: compute estimation and save
    console.log("Form Data:", formData);
    navigate('/home'); // Redirect back for now, later to estimate results
  };

  const updateGuests = (type, increment) => {
    setFormData(prev => {
      const current = prev.guests[type];
      const nextValue = increment ? current + 1 : Math.max(0, current - 1);
      return { ...prev, guests: { ...prev.guests, [type]: nextValue } };
    });
  };

  const handleGuestChange = (type, value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 0) {
      setFormData(prev => ({ ...prev, guests: { ...prev.guests, [type]: num } }));
    } else if (value === '') {
      setFormData(prev => ({ ...prev, guests: { ...prev.guests, [type]: 0 } }));
    }
  };

  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step-dot ${step >= 1 ? 'active' : ''}`} />
      <div className={`step-line ${step >= 2 ? 'active' : ''}`} />
      <div className={`step-dot ${step >= 2 ? 'active' : ''}`} />
      <div className={`step-line ${step >= 3 ? 'active' : ''}`} />
      <div className={`step-dot ${step >= 3 ? 'active' : ''}`} />
    </div>
  );

  return (
    <div className="event-planning-container page-container animate-slide-up">
      <header className="event-header">
        <button className="icon-btn" onClick={handleBack}>
          <ArrowLeft size={24} />
        </button>
        <h2>Planejamento</h2>
        <div style={{ width: 24 }} /> {/* Spacer */}
      </header>

      {renderStepIndicator()}

      <div className="form-content" ref={formContentRef}>
        {step === 1 && (
          <div className="step-content animate-slide-up">
            <h3>Detalhes do Evento</h3>
            
            <div className="input-group">
              <label>Tipo de Evento</label>
              <div className="chip-group">
                {['Família', 'Feriado', 'Social'].map(type => (
                  <button 
                    key={type}
                    className={`chip ${formData.eventType === type ? 'selected' : ''}`}
                    onClick={() => setFormData({...formData, eventType: type})}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Convidados</label>
              <div className="guest-counters">
                {[
                  { id: 'men', label: 'Homens', icon: '👨' },
                  { id: 'women', label: 'Mulheres', icon: '👩' },
                  { id: 'kids', label: 'Crianças', icon: '👶' }
                ].map(g => (
                  <div key={g.id} className="counter-row">
                    <span className="counter-label">{g.icon} {g.label}</span>
                    <div className="counter-controls">
                      <button onClick={() => updateGuests(g.id, false)}>-</button>
                      <input 
                        type="number" 
                        value={formData.guests[g.id] || ''} 
                        onChange={(e) => handleGuestChange(g.id, e.target.value)}
                        className="counter-input"
                        min="0"
                      />
                      <button onClick={() => updateGuests(g.id, true)}>+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label>Tipo de Comida</label>
              <select 
                className="select-input"
                value={formData.foodType}
                onChange={e => setFormData({...formData, foodType: e.target.value})}
              >
                <option value="">Selecione...</option>
                <option value="Churrasco">Churrasco</option>
                <option value="Pizza">Pizza</option>
                <option value="Chester">Chester/Ceia</option>
                <option value="Outro">Outro</option>
              </select>
              {formData.foodType === 'Outro' && (
                <input 
                  type="text" 
                  className="select-input text-input"
                  style={{ marginTop: '8px' }}
                  placeholder="Qual será a comida?"
                  value={formData.customFoodType}
                  onChange={e => setFormData({...formData, customFoodType: e.target.value})}
                />
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content animate-slide-up">
            <h3>Horários e Duração</h3>
            <p className="subtitle">Isso nos ajuda a calcular a quantidade de bebida e comida.</p>

            <div className="input-group">
              <label>Data do Evento</label>
              <input 
                type="date" 
                className="select-input"
                min={todayStr}
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            <div className="input-group">
              <label>Duração da festa (horas)</label>
              <div className="duration-slider">
                <input 
                  type="range" 
                  min="1" max="12" 
                  value={formData.duration}
                  onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                />
                <span className="duration-value">{formData.duration}h</span>
              </div>
            </div>

            <div className="input-group">
              <label>Horário de Início</label>
              <input 
                type="time" 
                className="select-input"
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
              />
            </div>

            <div className="info-card">
              <Clock size={20} color="var(--accent-color)" />
              <div>
                <h4>Dica de Preparo</h4>
                <p>Para um início às {formData.startTime}, sugerimos começar os preparos 1h30 antes para que tudo esteja pronto quando os convidados chegarem.</p>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="step-content animate-slide-up">
            <h3>Compras</h3>
            <p className="subtitle">Planejamento logístico para você não correr de última hora.</p>

            <div className="input-group">
              <label>Mercado Preferido (Opcional)</label>
              <input 
                type="text" 
                className="select-input text-input"
                placeholder="Ex: Assaí, Atacadão..."
                value={formData.preferredStore}
                onChange={e => setFormData({...formData, preferredStore: e.target.value})}
              />
            </div>

            <div className="timeline-preview">
              <h4>Cronograma Sugerido</h4>
              <div className="timeline-item">
                <div className="timeline-dot bg-purple" />
                <div className="timeline-content">
                  <h5>3 Dias Antes</h5>
                  <p>Bebidas, descartáveis e não perecíveis.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot bg-orange" />
                <div className="timeline-content">
                  <h5>1 Dia Antes</h5>
                  <p>Carnes e itens principais.</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot bg-green" />
                <div className="timeline-content">
                  <h5>No Dia</h5>
                  <p>Gelo, pão e itens frescos.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer-actions">
        <button 
          className="btn-primary" 
          onClick={handleNext}
          disabled={
            (step === 1 && (!formData.eventType || !formData.foodType || (formData.foodType === 'Outro' && !formData.customFoodType) || (formData.guests.men + formData.guests.women + formData.guests.kids) === 0)) ||
            (step === 2 && !formData.date)
          }
        >
          {step < 3 ? 'Avançar' : 'Calcular Estimativa'}
        </button>
      </div>
    </div>
  );
}
