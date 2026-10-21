import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Users, 
  ShoppingCart, 
  Receipt, 
  ArrowRight,
  Share2,
  Check,
  Sparkles,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Copy,
  X,
  UserCheck,
  UserX,
  Pencil,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../components/Auth/AuthContext';
import { 
  getTripById, 
  updateTrip,
  validateTripData,
  revokeParticipant, 
  increaseTripCapacity, 
  decreaseTripCapacity 
} from '../services/TripService';
import './TripDetails.css';

export default function TripDetails() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || user?.username || 'default_user';

  const [trip, setTrip] = useState(null);
  const [shareFeedback, setShareFeedback] = useState('');
  
  // Navigation Modal State
  const [isNavModalOpen, setIsNavModalOpen] = useState(false);

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Friends List Expand/Collapse State
  const [isFriendsListOpen, setIsFriendsListOpen] = useState(true);

  // Selected Slot Bottom Sheet State: { type: 'occupied', participant: ... } | { type: 'empty', slotIndex: ... } | null
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit Trip Modal State (Apenas Organizador)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    destination: '',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '18:00',
    peopleCount: 2
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    loadTripData();
  }, [tripId, userId]);

  const loadTripData = async () => {
    setIsLoading(true);
    const found = await getTripById(tripId);
    setTrip(found);
    setIsLoading(false);
  };

  // Abre modal de edição da viagem com os dados atuais
  const handleOpenEditModal = () => {
    if (!trip) return;
    setEditFormData({
      destination: trip.destination || '',
      startDate: trip.startDate || '',
      startTime: trip.startTime || '08:00',
      endDate: trip.endDate || '',
      endTime: trip.endTime || '18:00',
      peopleCount: trip.peopleCount || 2
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditErrors({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleEditStartDateChange = (val) => {
    setEditFormData(prev => {
      const nextEndDate = (!prev.endDate || prev.endDate < val) ? val : prev.endDate;
      return {
        ...prev,
        startDate: val,
        endDate: nextEndDate
      };
    });
    if (editErrors.startDate) setEditErrors(prev => ({ ...prev, startDate: null }));
    if (editErrors.endDate) setEditErrors(prev => ({ ...prev, endDate: null }));
  };

  const handleEditPeopleCountChange = (delta) => {
    const minAllowed = (trip?.participants || []).length || 1;
    setEditFormData(prev => {
      const current = Number(prev.peopleCount) || 1;
      const next = Math.max(minAllowed, current + delta);
      return { ...prev, peopleCount: next };
    });
    if (editErrors.peopleCount) {
      setEditErrors(prev => ({ ...prev, peopleCount: null }));
    }
  };

  const handleEditDirectPeopleCount = (val) => {
    if (val === '') {
      setEditFormData(prev => ({ ...prev, peopleCount: '' }));
      return;
    }
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setEditFormData(prev => ({ ...prev, peopleCount: parsed }));
      if (editErrors.peopleCount) {
        setEditErrors(prev => ({ ...prev, peopleCount: null }));
      }
    }
  };

  const handleEditPeopleCountBlur = () => {
    const minAllowed = (trip?.participants || []).length || 1;
    if (!editFormData.peopleCount || Number(editFormData.peopleCount) < minAllowed) {
      setEditFormData(prev => ({ ...prev, peopleCount: minAllowed }));
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const validation = validateTripData(editFormData);
    if (!validation.isValid) {
      setEditErrors(validation.errors);
      return;
    }

    const currentOccupied = (trip?.participants || []).length;
    if (Number(editFormData.peopleCount) < currentOccupied) {
      setEditErrors({
        peopleCount: `A quantidade de pessoas não pode ser menor que o total atual de amigos no grupo (${currentOccupied}).`
      });
      return;
    }

    try {
      setIsSavingEdit(true);
      const updated = await updateTrip(trip.id, editFormData);
      setTrip(updated);
      setIsEditModalOpen(false);
      setShareFeedback('Informações da viagem atualizadas com sucesso!');
      setTimeout(() => setShareFeedback(''), 3000);
    } catch (err) {
      setEditErrors({ general: err.message || 'Erro ao atualizar dados da viagem.' });
    } finally {
      setIsSavingEdit(false);
    }
  };

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Abre modal retangular de compartilhamento
  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
    setIsCopied(false);
  };

  // Copia link da viagem
  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/trips/${trip.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Erro ao copiar link:', err);
    }
  };

  // Enviar pelo WhatsApp
  const handleShareWhatsApp = () => {
    const shareUrl = `${window.location.origin}/trips/${trip.id}`;
    const text = `Bora viajar para ${trip.destination}? Acesse os detalhes da viagem, lista de compras e divisão de gastos: ${shareUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Seleciona app de navegação e já inicia a viagem imediatamente
  const handleSelectNavAppAndStart = (appType) => {
    const destinationQuery = encodeURIComponent(trip.destination);
    let targetUrl = '';

    switch (appType) {
      case 'waze':
        targetUrl = `https://waze.com/ul?q=${destinationQuery}&navigate=yes`;
        break;
      case 'google_maps':
        targetUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
        break;
      case 'apple_maps':
        targetUrl = `https://maps.apple.com/?daddr=${destinationQuery}`;
        break;
      case 'uber':
        targetUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${destinationQuery}`;
        break;
      default:
        targetUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}`;
    }

    setIsNavModalOpen(false);
    window.open(targetUrl, '_blank');
  };

  // Adiciona mais uma vaga na viagem
  const handleAddSpot = async () => {
    try {
      await increaseTripCapacity(trip.id);
      setShareFeedback('Mais uma vaga adicionada na viagem!');
      setTimeout(() => setShareFeedback(''), 3000);
      await loadTripData();
    } catch (err) {
      alert(err.message || 'Erro ao adicionar vaga.');
    }
  };

  // Exclui uma vaga vazia (reduz peopleCount)
  const handleDeleteEmptySlot = async () => {
    try {
      await decreaseTripCapacity(trip.id);
      setSelectedSlot(null);
      setShareFeedback('Vaga sobressalente excluída com sucesso!');
      setTimeout(() => setShareFeedback(''), 3000);
      await loadTripData();
    } catch (err) {
      alert(err.message || 'Erro ao excluir vaga.');
    }
  };

  // Exclui / revoga vaga de um participante a partir da barra inferior
  const handleRevokeParticipantFromSheet = async (participantId, participantName, participantBalance) => {
    // Bloqueia exclusão de participantes com pendências financeiras em aberto
    if (participantBalance && Number(participantBalance) !== 0) {
      alert(`Não é possível excluir a vaga de "${participantName}" pois ele possui pendências financeiras ativas (saldo de R$ ${Number(participantBalance).toFixed(2)}) na viagem. Quite as despesas antes de revogar a vaga.`);
      return;
    }

    const confirmed = window.confirm(`Deseja realmente excluir a vaga de "${participantName}"? A vaga voltará a ficar disponível para novos amigos.`);
    if (!confirmed) return;

    try {
      await revokeParticipant(trip.id, participantId);
      setSelectedSlot(null);
      setShareFeedback(`Vaga de ${participantName} liberada com sucesso.`);
      setTimeout(() => setShareFeedback(''), 4000);
      await loadTripData();
    } catch (err) {
      alert(err.message || 'Erro ao revogar vaga.');
    }
  };

  if (isLoading) {
    return (
      <div className="page-container trip-details-page" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 12 }}>
        <p style={{ color: 'var(--text-dark)', fontWeight: 600 }}>Carregando dados da viagem...</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page-container trip-details-page animate-slide-up">
        <header className="trip-details-header">
          <button className="header-btn" onClick={() => navigate('/trips')} aria-label="Voltar">
            <ArrowLeft size={20} />
          </button>
          <h1>Viagem não encontrada</h1>
          <div style={{ width: 40 }} />
        </header>

        <div className="trip-summary-hero" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p>A viagem selecionada não foi encontrada ou o link expirou.</p>
          <button 
            className="btn-submit" 
            style={{ marginTop: 20 }} 
            onClick={() => navigate('/trips')}
          >
            Voltar para Viagens
          </button>
        </div>
      </div>
    );
  }

  const isActive = trip.status === 'active';

  // Deduplica participantes para garantir que o mesmo usuário não apareça duplicado (ex: "Você" e ID)
  const rawParticipants = trip.participants || [];
  const participants = [];
  const seenUserKeys = new Set();
  
  for (const p of rawParticipants) {
    const key = p.userId ? `uid_${p.userId}` : (p.name ? `name_${p.name.toLowerCase()}` : `id_${p.id}`);
    if (!seenUserKeys.has(key)) {
      seenUserKeys.add(key);
      participants.push(p);
    }
  }

  const acceptedFriends = participants.filter(p => p.status === 'accepted');
  const acceptedPercentage = Math.min(100, Math.round((acceptedFriends.length / trip.peopleCount) * 100));

  // Verifica se o usuário atual é o organizador
  const isOrganizer = trip.createdByUserId === user?.id ||
    trip.createdByUsername === user?.username ||
    trip.createdBy === userId ||
    participants.some(p => (p.userId === user?.id || p.name === user?.username) && p.role === 'Organizador');

  return (
    <div className="page-container trip-details-page animate-slide-up">
      {/* Header */}
      <header className="trip-details-header">
        <button className="header-btn" onClick={() => navigate('/trips')} aria-label="Voltar para viagens">
          <ArrowLeft size={20} />
        </button>
        <h1>Painel da Viagem</h1>
        {isOrganizer ? (
          <div className="header-actions-group">
            <button 
              className="header-btn edit-trip-btn" 
              onClick={handleOpenEditModal} 
              title="Editar informações da viagem"
              aria-label="Editar informações da viagem"
            >
              <Pencil size={17} color="#2a9d8f" />
            </button>
            <button 
              className="header-btn share-btn" 
              onClick={handleOpenShareModal} 
              title="Compartilhar viagem com amigos"
              aria-label="Compartilhar viagem com amigos"
            >
              <Share2 size={18} color="#e07a5f" />
            </button>
          </div>
        ) : (
          <div style={{ width: 40 }} />
        )}
      </header>

      {/* Toast Feedback */}
      {shareFeedback && (
        <div className="share-feedback-toast animate-slide-up">
          <Check size={18} color="#2a9d8f" />
          <span>{shareFeedback}</span>
        </div>
      )}

      {/* Card de Resumo Completo da Viagem */}
      <div className="trip-summary-hero">
        {/* Destino e Status */}
        <div className="destination-header-block">
          <div className="destination-meta-left">
            <span className="destination-pin-icon">📍</span>
            <div className="destination-title-wrapper">
              <div className="destination-name-text">{trip.destination}</div>
              {isOrganizer && (
                <button 
                  className="btn-inline-pencil" 
                  onClick={handleOpenEditModal} 
                  title="Editar informações da viagem"
                  aria-label="Editar informações da viagem"
                >
                  <Pencil size={14} color="#2a9d8f" />
                </button>
              )}
            </div>
          </div>
          <span className={`trip-status-badge ${trip.status}`}>
            {isActive ? '● Ativa' : trip.status === 'scheduled' ? 'Agendada' : 'Concluída'}
          </span>
        </div>

        {/* Datas e Horários */}
        <div className="hero-meta-row">
          <div className="hero-meta-item">
            <Calendar size={16} color="#e07a5f" />
            <span>
              {formatDateDisplay(trip.startDate)} às {trip.startTime} — {formatDateDisplay(trip.endDate)} às {trip.endTime}
            </span>
          </div>
          <div className="hero-meta-item">
            <Users size={16} color="#89b4b1" />
            <span>{trip.peopleCount} {trip.peopleCount === 1 ? 'amigo na viagem' : 'amigos na viagem'}</span>
          </div>
        </div>

        {/* Card: Começar Viagem (Seleciona app e já inicia imediatamente) */}
        <div 
          className="start-trip-action-card" 
          onClick={() => setIsNavModalOpen(true)} 
          role="button" 
          tabIndex={0}
        >
          <div className="start-trip-icon-bubble">🚗</div>
          <div className="start-trip-text-content">
            <div className="start-trip-title">Começar viagem</div>
            <div className="start-trip-subtitle">
              Escolha seu aplicativo de navegação e inicie a rota
            </div>
          </div>
          <ChevronRight size={20} color="#0077b6" />
        </div>

        {/* Seção de Amigos & Confirmações */}
        <div className="friends-section-summary">
          <div className="friends-status-header">
            <span className="friends-accepted-label">
              <strong>{acceptedFriends.length}</strong> de <strong>{trip.peopleCount}</strong> amigos já aceitaram o convite
            </span>
            <span className="friends-percent-badge">{acceptedPercentage}%</span>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="friends-progress-bar">
            <div 
              className="friends-progress-fill" 
              style={{ width: `${acceptedPercentage}%` }} 
            />
          </div>

          {/* Cabeçalho Acordeão: Abrir e Fechar Lista de Amigos */}
          <div 
            className="friends-toggle-header" 
            onClick={() => setIsFriendsListOpen(prev => !prev)}
            role="button"
            tabIndex={0}
          >
            <span className="friends-chips-title">
              Amigos no grupo ({participants.length}/{trip.peopleCount})
            </span>
            <div className="friends-toggle-cue">
              <span>{isFriendsListOpen ? 'Ocultar' : 'Ver lista'}</span>
              {isFriendsListOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>

          {/* Lista de Amigos (Expansível / Colapsável) */}
          {isFriendsListOpen && (
            <div className="friends-chips-container animate-slide-up">
              <div className="friends-chips-list">
                {participants.map(friend => {
                  const isOrg = friend.role === 'Organizador';
                  const isConfirmed = friend.status === 'accepted';
                  const isMe = (friend.userId && friend.userId === user?.id) || 
                               (user?.username && friend.name === user?.username) ||
                               friend.name === 'Você';
                  const displayName = isMe ? `${friend.name === 'Você' ? (user?.username || 'Você') : friend.name} (Você)` : friend.name;

                  return (
                    <div 
                      key={friend.id} 
                      className={`friend-chip ${isConfirmed ? 'confirmed' : 'pending'}`}
                      onClick={() => setSelectedSlot({ type: 'occupied', participant: { ...friend, displayName } })}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="friend-avatar-circle">
                        {(friend.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="friend-chip-info">
                        <span className="friend-name-text">{displayName}</span>
                        <div className="friend-chip-right">
                          <span className="friend-status-text">
                            {isOrg ? 'Organizador' : isConfirmed ? 'Confirmado' : 'Aguardando'}
                          </span>
                          <ChevronRight size={15} color="#b5a999" />
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Vagas disponíveis: Apenas o organizador pode tocar para gerenciar/excluir a vaga */}
                {Array.from({ length: Math.max(0, trip.peopleCount - participants.length) }).map((_, index) => (
                  <div 
                    key={`pending_slot_${index}`} 
                    className={`friend-chip empty-slot ${!isOrganizer ? 'readonly' : ''}`} 
                    onClick={() => {
                      if (isOrganizer) {
                        setSelectedSlot({ type: 'empty', slotIndex: participants.length + index + 1 });
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: isOrganizer ? 'pointer' : 'default' }}
                    title={isOrganizer ? "Toque para ver opções da vaga" : "Vaga aberta disponível"}
                  >
                    <div className="friend-avatar-circle empty">
                      +
                    </div>
                    <div className="friend-chip-info">
                      <span className="friend-name-text">Vaga {participants.length + index + 1} disponível</span>
                      <span className="friend-status-action">
                        {isOrganizer ? 'Toque para gerenciar ➔' : 'Vaga aberta'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Botões de Ação de Amigos (Apenas para o Organizador) */}
              {isOrganizer && (
                <div className="friends-action-buttons">
                  {/* Adicionar Vaga: Apenas adiciona mais uma vaga na viagem */}
                  <button className="btn-add-friend-pill" onClick={handleAddSpot}>
                    <Plus size={15} />
                    <span>Adicionar Vaga</span>
                  </button>
                  {/* Convidar via Link: Abre o modal retangular com Copiar e WhatsApp */}
                  <button className="btn-share-friend-pill" onClick={handleOpenShareModal}>
                    <Share2 size={15} />
                    <span>Convidar via Link</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="hub-section-title">Gerenciamento da Viagem</div>

      {/* Os Dois Cards Principais */}
      <div className="hub-cards-container">
        {/* Card 1: Lista de Mercado */}
        <div 
          className="hub-card market-theme"
          onClick={() => navigate(`/estimate?tripId=${trip.id}&tripDestination=${encodeURIComponent(trip.destination || '')}`, { state: { tripId: trip.id, tripDestination: trip.destination } })}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-content">
            <div className="hub-card-icon-bubble">
              <ShoppingCart size={28} color="white" />
            </div>
            <h2>Lista de mercado</h2>
            <p>Conectada ao estimador de preços. Planeje os produtos e suprimentos que não podem faltar.</p>
            <div className="hub-badge-pill">
              <Sparkles size={14} />
              <span>Lista Compartilhada do Grupo</span>
            </div>
          </div>
          <div className="hub-arrow-container">
            <ArrowRight size={28} color="white" />
          </div>
        </div>

        {/* Card 2: Dividir Gastos */}
        <div 
          className="hub-card expenses-theme"
          onClick={() => {
            alert('Módulo de Divisão de Gastos: pronto para definir o rateio entre os ' + acceptedFriends.length + ' amigos confirmados!');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="hub-card-content">
            <div className="hub-card-icon-bubble">
              <Receipt size={28} color="white" />
            </div>
            <h2>Dividir gastos</h2>
            <p>Quem pagou o quê: acerte contas com amigos após compras de mercado ou despesas na rua.</p>
            <div className="hub-badge-pill">
              <span>Rateio entre {acceptedFriends.length} confirmados</span>
            </div>
          </div>
          <div className="hub-arrow-container">
            <ArrowRight size={28} color="white" />
          </div>
        </div>
      </div>

      {/* Modal: Escolha do App de Navegação para Iniciar a Viagem (via Portal para Viewport Correta) */}
      {isNavModalOpen && createPortal(
        <div className="modal-portal-overlay bottom-sheet-mode" onClick={() => setIsNavModalOpen(false)}>
          <div className="modal-content nav-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Como deseja viajar?</h2>
              <button className="header-btn" onClick={() => setIsNavModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p className="nav-modal-subtitle">
              Selecione o aplicativo para iniciar sua viagem para <strong>{trip.destination}</strong>:
            </p>

            <div className="nav-options-list">
              <button className="nav-option-btn waze" onClick={() => handleSelectNavAppAndStart('waze')}>
                <span className="nav-btn-icon">🚗</span>
                <div className="nav-btn-text">
                  <strong>Waze</strong>
                  <span>Navegar com alertas de trânsito em tempo real</span>
                </div>
              </button>

              <button className="nav-option-btn gmaps" onClick={() => handleSelectNavAppAndStart('google_maps')}>
                <span className="nav-btn-icon">🗺️</span>
                <div className="nav-btn-text">
                  <strong>Google Maps</strong>
                  <span>Iniciar navegação passo a passo</span>
                </div>
              </button>

              <button className="nav-option-btn apple" onClick={() => handleSelectNavAppAndStart('apple_maps')}>
                <span className="nav-btn-icon">🍎</span>
                <div className="nav-btn-text">
                  <strong>Apple Maps</strong>
                  <span>Abrir aplicativo de mapas nativo do iPhone</span>
                </div>
              </button>

              <button className="nav-option-btn uber" onClick={() => handleSelectNavAppAndStart('uber')}>
                <span className="nav-btn-icon">🚙</span>
                <div className="nav-btn-text">
                  <strong>Uber</strong>
                  <span>Pedir motorista diretamente para o destino</span>
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Retangular de Compartilhamento (Copiar Link ou WhatsApp) */}
      {isShareModalOpen && createPortal(
        <div className="modal-portal-overlay centered-mode" onClick={() => setIsShareModalOpen(false)}>
          <div className="share-modal-card" onClick={e => e.stopPropagation()}>
            <div className="share-modal-header">
              <h3>Convidar Amigos</h3>
              <button className="header-btn" onClick={() => setIsShareModalOpen(false)} aria-label="Fechar">
                <X size={18} />
              </button>
            </div>

            <p className="share-modal-desc">
              Compartilhe o link da viagem para seus amigos confirmarem presença em <strong>{trip.destination}</strong>:
            </p>

            {/* Caixa com o Link e Botão Copiar */}
            <div className="share-link-group">
              <input 
                type="text" 
                readOnly 
                value={`${window.location.origin}/trips/${trip.id}`} 
                className="share-link-input"
              />
              <button 
                type="button" 
                className={`btn-copy-link ${isCopied ? 'copied' : ''}`} 
                onClick={handleCopyLink}
              >
                {isCopied ? <Check size={15} /> : <Copy size={15} />}
                <span>{isCopied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>

            {/* Botão Enviar pelo WhatsApp */}
            <button type="button" className="btn-whatsapp-share" onClick={handleShareWhatsApp}>
              <span className="whatsapp-icon">💬</span>
              <span>Enviar pelo WhatsApp</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Barra Inferior (Bottom Sheet) de Gerenciamento da Vaga */}
      {selectedSlot && createPortal(
        <div className="modal-portal-overlay bottom-sheet-mode" onClick={() => setSelectedSlot(null)}>
          <div className="modal-content slot-management-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {selectedSlot.type === 'occupied' 
                  ? 'Detalhes da Vaga' 
                  : `Vaga ${selectedSlot.slotIndex}`
                }
              </h2>
              <button className="header-btn" onClick={() => setSelectedSlot(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Caso 1: Vaga Ocupada por um Participante */}
            {selectedSlot.type === 'occupied' && (
              <div className="slot-sheet-body">
                <div className="slot-user-preview-card">
                  <div className="slot-user-avatar">
                    {(selectedSlot.participant.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="slot-user-details">
                    <span className="slot-user-name">
                      {selectedSlot.participant.displayName || selectedSlot.participant.name}
                    </span>
                    <span className="slot-user-role-badge">
                      {selectedSlot.participant.role === 'Organizador' ? 'Organizador da Viagem' : 'Convidado'}
                    </span>
                    <span className="slot-user-status-text">
                      {selectedSlot.participant.status === 'accepted' ? '✓ Presença confirmada' : '⏳ Aguardando confirmação'}
                    </span>
                  </div>
                </div>

                <div className="slot-sheet-actions">
                  {/* Botão de Excluir / Revogar (se o usuário ativo for organizador e não for o próprio organizador) */}
                  {isOrganizer && selectedSlot.participant.role !== 'Organizador' ? (
                    <button 
                      type="button" 
                      className="btn-slot-delete"
                      onClick={() => handleRevokeParticipantFromSheet(
                        selectedSlot.participant.id, 
                        selectedSlot.participant.name,
                        selectedSlot.participant.balance
                      )}
                    >
                      <Trash2 size={16} />
                      <span>Excluir vaga (liberar para convite)</span>
                    </button>
                  ) : selectedSlot.participant.role === 'Organizador' ? (
                    <p className="slot-organizer-notice">
                      Este é o Organizador da viagem e sua vaga não pode ser excluída.
                    </p>
                  ) : null}

                  {/* Botão Voltar */}
                  <button 
                    type="button" 
                    className="btn-slot-back" 
                    onClick={() => setSelectedSlot(null)}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}

            {/* Caso 2: Vaga Vazia / Disponível */}
            {selectedSlot.type === 'empty' && (
              <div className="slot-sheet-body">
                <div className="slot-empty-preview-card">
                  <div className="slot-empty-icon-circle">
                    <Users size={24} color="#e07a5f" />
                  </div>
                  <div className="slot-empty-text-group">
                    <span className="slot-empty-title">Nenhum amigo cadastrado</span>
                    <span className="slot-empty-desc">
                      Esta vaga foi adicionada mas ainda não foi preenchida por nenhum usuário.
                    </span>
                  </div>
                </div>

                <div className="slot-sheet-actions">
                  {/* Botão Excluir Vaga (Reduz a capacidade) */}
                  <button 
                    type="button" 
                    className="btn-slot-delete"
                    onClick={handleDeleteEmptySlot}
                  >
                    <Trash2 size={16} />
                    <span>Excluir vaga</span>
                  </button>

                  {/* Botão Convidar Amigo via Link (Atalho conveniente) */}
                  <button 
                    type="button" 
                    className="btn-slot-invite-shortcut"
                    onClick={() => {
                      setSelectedSlot(null);
                      handleOpenShareModal();
                    }}
                  >
                    <Share2 size={16} />
                    <span>Convidar amigo para esta vaga</span>
                  </button>

                  {/* Botão Voltar */}
                  <button 
                    type="button" 
                    className="btn-slot-back" 
                    onClick={() => setSelectedSlot(null)}
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* Modal de Edição da Viagem (Apenas Organizador) */}
      {isEditModalOpen && createPortal(
        <div className="modal-portal-overlay bottom-sheet-mode" onClick={handleCloseEditModal}>
          <div className="modal-content edit-trip-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Informações da Viagem</h2>
              <button className="header-btn" onClick={handleCloseEditModal} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>

            {editErrors.general && (
              <div className="form-error-banner animate-slide-up">
                <AlertCircle size={16} />
                <span>{editErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="trip-form">
              {/* Campo Destino */}
              <div className="form-group">
                <label htmlFor="edit-destination">Destino da Viagem</label>
                <div className="input-with-icon">
                  <input
                    id="edit-destination"
                    type="text"
                    className="input-field"
                    placeholder="Ex: Rio de Janeiro, Ubatuba, Paris..."
                    value={editFormData.destination}
                    onChange={(e) => handleEditChange('destination', e.target.value)}
                  />
                </div>
                {editErrors.destination && <span className="field-error-text">{editErrors.destination}</span>}
              </div>

              {/* Início da Viagem */}
              <div className="datetime-card">
                <div className="datetime-header">
                  <Calendar size={18} color="#e07a5f" />
                  <span className="datetime-title">Início da Viagem</span>
                </div>
                
                <div className="datetime-stack">
                  <div className="datetime-field-group">
                    <label className="sub-field-label">Data de Chegada</label>
                    <input
                      type="date"
                      className="input-field mobile-date-input"
                      value={editFormData.startDate}
                      onChange={(e) => handleEditStartDateChange(e.target.value)}
                    />
                    {editErrors.startDate && <span className="field-error-text">{editErrors.startDate}</span>}
                  </div>

                  <div className="datetime-field-group">
                    <label className="sub-field-label">Horário Previsto</label>
                    <div className="input-with-icon">
                      <Clock size={16} color="#8c887b" className="field-left-icon" />
                      <input
                        type="time"
                        className="input-field with-icon"
                        value={editFormData.startTime}
                        onChange={(e) => handleEditChange('startTime', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Término da Viagem */}
              <div className="datetime-card">
                <div className="datetime-header">
                  <Calendar size={18} color="#e07a5f" />
                  <span className="datetime-title">Término da Viagem</span>
                </div>

                <div className="datetime-stack">
                  <div className="datetime-field-group">
                    <label className="sub-field-label">Data de Retorno</label>
                    <input
                      type="date"
                      min={editFormData.startDate}
                      className="input-field mobile-date-input"
                      value={editFormData.endDate}
                      onChange={(e) => handleEditChange('endDate', e.target.value)}
                    />
                    {editErrors.endDate && <span className="field-error-text">{editErrors.endDate}</span>}
                  </div>

                  <div className="datetime-field-group">
                    <label className="sub-field-label">Horário de Saída</label>
                    <div className="input-with-icon">
                      <Clock size={16} color="#8c887b" className="field-left-icon" />
                      <input
                        type="time"
                        className="input-field with-icon"
                        value={editFormData.endTime}
                        onChange={(e) => handleEditChange('endTime', e.target.value)}
                      />
                    </div>
                    {editErrors.endTime && <span className="field-error-text">{editErrors.endTime}</span>}
                  </div>
                </div>
              </div>

              {/* Quantidade de Pessoas */}
              <div className="form-group">
                <label>Quantidade Total de Vagas</label>
                <div className="counter-picker">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => handleEditPeopleCountChange(-1)}
                    disabled={Number(editFormData.peopleCount) <= ((trip.participants || []).length || 1)}
                    aria-label="Diminuir vagas"
                  >
                    -
                  </button>
                  <div className="counter-value-container">
                    <input
                      type="number"
                      min={(trip.participants || []).length || 1}
                      max={999}
                      className="counter-direct-input"
                      value={editFormData.peopleCount}
                      onChange={(e) => handleEditDirectPeopleCount(e.target.value)}
                      onBlur={handleEditPeopleCountBlur}
                      aria-label="Quantidade de vagas"
                    />
                    <span className="counter-label">
                      {editFormData.peopleCount === 1 ? 'vaga' : 'vagas'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => handleEditPeopleCountChange(1)}
                    aria-label="Aumentar vagas"
                  >
                    +
                  </button>
                </div>
                <span className="field-hint-text">
                  Mínimo permitido: {(trip.participants || []).length} (amigos atualmente no grupo).
                </span>
                {editErrors.peopleCount && <span className="field-error-text">{editErrors.peopleCount}</span>}
              </div>

              {/* Botões do Formulário */}
              <div className="edit-form-actions">
                <button
                  type="submit"
                  className="btn-submit-edit"
                  disabled={isSavingEdit}
                >
                  <Check size={18} />
                  <span>{isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}</span>
                </button>
                <button
                  type="button"
                  className="btn-cancel-edit"
                  onClick={handleCloseEditModal}
                  disabled={isSavingEdit}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
