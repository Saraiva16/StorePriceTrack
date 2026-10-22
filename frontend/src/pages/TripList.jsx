import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  ChevronRight, 
  X,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../components/Auth/AuthContext';
import { getTrips, createTrip, validateTripData } from '../services/TripService';
import './TripList.css';

export default function TripList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || user?.username || 'default_user';

  const todayStr = new Date().toISOString().split('T')[0];

  const [trips, setTrips] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    destination: '',
    address: '',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '18:00',
    peopleCount: 2
  });

  const loadTrips = async () => {
    const list = await getTrips();
    setTrips(Array.isArray(list) ? list : []);
  };

  useEffect(() => {
    loadTrips();
  }, [userId]);

  const handleOpenModal = () => {
    setFormData({
      destination: '',
      address: '',
      startDate: todayStr,
      startTime: '08:00',
      endDate: todayStr,
      endTime: '18:00',
      peopleCount: 2
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormErrors({});
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleStartDateChange = (val) => {
    setFormData(prev => {
      // Se a data de término for anterior à nova data de início, ajusta automaticamente
      const nextEndDate = (!prev.endDate || prev.endDate < val) ? val : prev.endDate;
      return {
        ...prev,
        startDate: val,
        endDate: nextEndDate
      };
    });
    if (formErrors.startDate) setFormErrors(prev => ({ ...prev, startDate: null }));
    if (formErrors.endDate) setFormErrors(prev => ({ ...prev, endDate: null }));
  };

  const handlePeopleCountChange = (delta) => {
    setFormData(prev => {
      const current = Number(prev.peopleCount) || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, peopleCount: next };
    });
    if (formErrors.peopleCount) {
      setFormErrors(prev => ({ ...prev, peopleCount: null }));
    }
  };

  const handleDirectPeopleCountChange = (val) => {
    // Permite que o campo fique vazio temporariamente enquanto o usuário digita
    if (val === '') {
      setFormData(prev => ({ ...prev, peopleCount: '' }));
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setFormData(prev => ({ ...prev, peopleCount: parsed }));
      if (formErrors.peopleCount) {
        setFormErrors(prev => ({ ...prev, peopleCount: null }));
      }
    }
  };

  const handlePeopleCountBlur = () => {
    if (!formData.peopleCount || Number(formData.peopleCount) < 1) {
      setFormData(prev => ({ ...prev, peopleCount: 1 }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validation = validateTripData(formData);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      const created = await createTrip(formData);
      setIsModalOpen(false);
      await loadTrips();
      // Redireciona diretamente para o painel da viagem recém-criada
      navigate(`/trips/${created.id}`);
    } catch (err) {
      setFormErrors({ general: err.message || 'Erro ao criar evento de viagem.' });
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="page-container trips-page animate-slide-up">
      {/* Header */}
      <header className="trips-header">
        <button className="header-btn" onClick={() => navigate('/home')} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <h1>Viagens e Eventos</h1>
        {trips.length > 0 ? (
          <button className="header-btn primary" onClick={handleOpenModal} aria-label="Nova Viagem">
            <Plus size={20} />
          </button>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </header>

      {/* Empty State: Card tracejado '+ Novo Evento' */}
      {trips.length === 0 ? (
        <div className="dashed-card" onClick={handleOpenModal} role="button" tabIndex={0}>
          <div className="dashed-card-icon">
            <Plus size={32} />
          </div>
          <div className="dashed-card-title">Novo Evento</div>
          <p className="dashed-card-desc">
            Nenhuma viagem ativa ou agendada. Toque aqui para planejar sua primeira viagem com amigos!
          </p>
        </div>
      ) : (
        <div className="trips-section">
          <span className="section-label">Suas Viagens ({trips.length})</span>
          
          {trips.map(trip => {
            const isActive = trip.status === 'active';
            return (
              <div 
                key={trip.id} 
                className={`trip-card ${isActive ? 'active-trip' : ''}`}
                onClick={() => navigate(`/trips/${trip.id}`)}
              >
                <div className="trip-card-header">
                  <div className="trip-destination-group">
                    <span className="trip-destination-icon">✈️</span>
                    <span className="trip-destination-name">{trip.destination}</span>
                  </div>
                  <span className={`trip-status-badge ${trip.status}`}>
                    {isActive ? '● Ativa' : trip.status === 'scheduled' ? 'Agendada' : 'Concluída'}
                  </span>
                </div>

                <div className="trip-card-body">
                  <div className="trip-info-row">
                    <Calendar size={15} color="#e07a5f" />
                    <span>
                      {formatDateDisplay(trip.startDate)} ({trip.startTime}) até {formatDateDisplay(trip.endDate)} ({trip.endTime})
                    </span>
                  </div>

                  <div className="trip-info-row">
                    <Users size={15} color="#89b4b1" />
                    <span>{trip.peopleCount} {trip.peopleCount === 1 ? 'pessoa' : 'pessoas'} participando</span>
                  </div>
                </div>

                <div className="trip-card-footer">
                  <span className="trip-action-hint">Acessar lista e gastos</span>
                  <ChevronRight size={18} color="#e07a5f" />
                </div>
              </div>
            );
          })}

          {/* Botão tracejado secundário para permitir criar novas viagens mesmo já tendo algumas */}
          <button className="dashed-btn-add" onClick={handleOpenModal}>
            <Plus size={18} />
            Novo Evento
          </button>
        </div>
      )}

      {/* Modal / Sheet de Cadastro de Viagem */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Planejar Nova Viagem</h2>
              <button className="header-btn" onClick={handleCloseModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {formErrors.general && (
                <div className="form-error" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertCircle size={16} />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* Destino */}
              <div className="form-group">
                <label>Qual o destino?</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Ubatuba - SP, Praia do Rosa..."
                    value={formData.destination}
                    onChange={e => handleChange('destination', e.target.value)}
                  />
                </div>
                {formErrors.destination && <span className="form-error">{formErrors.destination}</span>}
              </div>

              {/* Endereço Obrigatório */}
              <div className="form-group">
                <label>Endereço <span style={{ color: '#e07a5f' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Ex: Rua das Flores, 123 ou ponto de referência exato"
                    value={formData.address}
                    onChange={e => handleChange('address', e.target.value)}
                  />
                </div>
                {formErrors.address && <span className="form-error">{formErrors.address}</span>}
              </div>

              {/* Bloco 1: Início da Viagem */}
              <div className="datetime-card">
                <div className="datetime-header">
                  <Calendar size={16} color="#e07a5f" />
                  <span className="datetime-title">Início da Viagem</span>
                </div>
                <div className="datetime-stack">
                  <div className="datetime-field-group">
                    <label className="sub-field-label">Data de Partida</label>
                    <input
                      type="date"
                      className="input-field mobile-date-input"
                      min={todayStr}
                      value={formData.startDate}
                      onChange={e => handleStartDateChange(e.target.value)}
                    />
                    {formErrors.startDate && <span className="form-error">{formErrors.startDate}</span>}
                  </div>
                  <div className="datetime-field-group">
                    <label className="sub-field-label">Horário de Início</label>
                    <input
                      type="time"
                      className="input-field mobile-time-input"
                      value={formData.startTime}
                      onChange={e => handleChange('startTime', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Término da Viagem */}
              <div className="datetime-card">
                <div className="datetime-header">
                  <Calendar size={16} color="#2a9d8f" />
                  <span className="datetime-title">Término da Viagem</span>
                </div>
                <div className="datetime-stack">
                  <div className="datetime-field-group">
                    <label className="sub-field-label">Data de Retorno</label>
                    <input
                      type="date"
                      className="input-field mobile-date-input"
                      min={formData.startDate || todayStr}
                      value={formData.endDate}
                      onChange={e => handleChange('endDate', e.target.value)}
                    />
                    {formErrors.endDate && <span className="form-error">{formErrors.endDate}</span>}
                  </div>
                  <div className="datetime-field-group">
                    <label className="sub-field-label">Horário de Retorno</label>
                    <input
                      type="time"
                      className="input-field mobile-time-input"
                      value={formData.endTime}
                      onChange={e => handleChange('endTime', e.target.value)}
                    />
                    {formErrors.endTime && <span className="form-error">{formErrors.endTime}</span>}
                  </div>
                </div>
              </div>

              {/* Quantas pessoas irão (Input direto + botões + e -) */}
              <div className="form-group">
                <label>Quantas pessoas irão?</label>
                <div className="counter-picker">
                  <button 
                    type="button" 
                    className="counter-btn" 
                    onClick={() => handlePeopleCountChange(-1)}
                    disabled={Number(formData.peopleCount) <= 1}
                    aria-label="Diminuir uma pessoa"
                  >
                    -
                  </button>
                  <div className="counter-input-container">
                    <input
                      type="number"
                      min="1"
                      max="999"
                      className="counter-input-field"
                      value={formData.peopleCount}
                      onChange={e => handleDirectPeopleCountChange(e.target.value)}
                      onBlur={handlePeopleCountBlur}
                    />
                    <span className="counter-label-text">
                      {Number(formData.peopleCount) === 1 ? 'pessoa' : 'pessoas'}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="counter-btn" 
                    onClick={() => handlePeopleCountChange(1)}
                    aria-label="Aumentar uma pessoa"
                  >
                    +
                  </button>
                </div>
                {formErrors.peopleCount && <span className="form-error">{formErrors.peopleCount}</span>}
              </div>

              {/* Ações */}
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-submit">
                  Salvar Viagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
