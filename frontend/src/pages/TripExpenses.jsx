import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft, 
  Plus, 
  Receipt, 
  Calendar, 
  DollarSign, 
  Users, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  X, 
  AlertCircle,
  CreditCard,
  Trash2
} from 'lucide-react';
import { useAuth } from '../components/Auth/AuthContext';
import { getTripById } from '../services/TripService';
import { 
  fetchTripExpenses, 
  createTripExpense, 
  fetchTripDebts, 
  deleteTripExpense, 
  updateUserPixKey 
} from '../services/TripExpenseService';
import './TripExpenses.css';

export default function TripExpenses() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentUserId = user?.id;

  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // PIX State
  const [pixKey, setPixKey] = useState('');
  const [isEditingPix, setIsEditingPix] = useState(false);
  const [newPixInput, setNewPixInput] = useState('');

  // Expand/Collapse debts
  const [expandedDebts, setExpandedDebts] = useState({});

  // Modal Novo Gasto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [expenseDate, setExpenseDate] = useState(todayStr);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [tripId]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [tripData, expensesData, debtsData] = await Promise.all([
        getTripById(tripId),
        fetchTripExpenses(tripId),
        fetchTripDebts(tripId)
      ]);
      setTrip(tripData);
      setExpenses(expensesData);
      setDebts(debtsData);

      // Descobre chave pix atual do usuário logado se presente nos dados
      const currentUserExpense = expensesData.find(e => e.paidByUserId === currentUserId);
      if (currentUserExpense?.paidByPixKey) {
        setPixKey(currentUserExpense.paidByPixKey);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSavePix = async () => {
    try {
      const res = await updateUserPixKey(tripId, newPixInput);
      setPixKey(res.pixKey || newPixInput);
      setIsEditingPix(false);
      showToast('Chave Pix atualizada com sucesso!');
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Erro ao atualizar chave Pix.');
    }
  };

  const handleOpenModal = () => {
    setDescription('');
    setAmount('');
    setExpenseDate(todayStr);
    // Por padrão seleciona todos os participantes que aceitaram ou estão na viagem
    const validUserIds = (trip?.participants || [])
      .map(p => p.userId)
      .filter(id => id != null);
    setSelectedUserIds(validUserIds);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleToggleUser = (userId) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllUsers = () => {
    const allIds = (trip?.participants || [])
      .map(p => p.userId)
      .filter(id => id != null);
    if (selectedUserIds.length === allIds.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(allIds);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setFormError('Informe a descrição do que foi gasto.');
      return;
    }
    const cleanAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(cleanAmount) || cleanAmount <= 0) {
      setFormError('Informe um valor válido maior que zero.');
      return;
    }
    if (selectedUserIds.length === 0) {
      setFormError('Selecione pelo menos um amigo para dividir o gasto.');
      return;
    }

    try {
      setIsSubmitting(true);
      await createTripExpense(tripId, {
        description: description.trim(),
        amount: cleanAmount,
        expenseDate,
        participantUserIds: selectedUserIds
      });
      setIsModalOpen(false);
      showToast('Gasto registrado e rateio calculado!');
      await loadAllData();
    } catch (err) {
      setFormError(err.message || 'Erro ao registrar despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Deseja excluir este gasto e recalcular a divisão?')) return;
    try {
      await deleteTripExpense(tripId, expenseId);
      showToast('Gasto excluído com sucesso.');
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Erro ao excluir gasto.');
    }
  };

  const toggleDebtExpand = (creditorId) => {
    setExpandedDebts(prev => ({
      ...prev,
      [creditorId]: !prev[creditorId]
    }));
  };

  const handleCopyPix = async (key) => {
    try {
      await navigator.clipboard.writeText(key);
      showToast('Chave Pix copiada!');
    } catch (e) {
      showToast('Erro ao copiar Pix');
    }
  };

  // Participantes da viagem com userId válido
  const validParticipants = (trip?.participants || []).filter(p => p.userId != null);

  if (isLoading) {
    return (
      <div className="page-container trip-expenses-page" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p>Carregando divisão de gastos...</p>
      </div>
    );
  }

  const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;
  const splitPerPerson = selectedUserIds.length > 0 ? (parsedAmount / selectedUserIds.length).toFixed(2) : '0.00';

  return (
    <div className="page-container trip-expenses-page animate-slide-up">
      {/* Header */}
      <header className="expenses-header">
        <button className="header-btn" onClick={() => navigate(`/trips/${tripId}`)} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <h1>Dividir Gastos</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="share-feedback-toast animate-slide-up">
          <Check size={18} color="#2a9d8f" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Card Chave Pix do Usuário Atual */}
      <div className="pix-user-card">
        <div className="pix-user-header">
          <div className="pix-title-group">
            <CreditCard size={18} />
            <span>Sua Chave Pix para Recebimentos</span>
          </div>
          {!isEditingPix && (
            <button className="btn-edit-pix" onClick={() => { setIsEditingPix(true); setNewPixInput(pixKey); }}>
              {pixKey ? 'Alterar' : 'Cadastrar'}
            </button>
          )}
        </div>

        {isEditingPix ? (
          <div className="pix-edit-form">
            <input 
              type="text" 
              className="pix-edit-input" 
              placeholder="CPF, E-mail, Celular ou Chave Aleatória..."
              value={newPixInput}
              onChange={e => setNewPixInput(e.target.value)}
            />
            <button className="btn-save-pix" onClick={handleSavePix}>Salvar</button>
            <button className="btn-cancel-pix" onClick={() => setIsEditingPix(false)}>Cancelar</button>
          </div>
        ) : (
          <div className="pix-key-display">
            {pixKey ? pixKey : 'Nenhuma chave cadastrada. Cadastre para seus amigos lhe pagarem!'}
          </div>
        )}
      </div>

      {/* Botão Novo Gasto */}
      <button className="btn-new-expense" onClick={handleOpenModal}>
        <Plus size={20} />
        <span>Adicionar Novo Gasto</span>
      </button>

      {/* Seção 1: O Que Você Deve para Outros Amigos */}
      <div className="expenses-section-title">
        <DollarSign size={18} color="#e07a5f" />
        <span>Valores que você deve pagar</span>
      </div>

      <div className="debt-cards-list">
        {debts.length === 0 ? (
          <div className="pix-user-card" style={{ textAlign: 'center', color: '#8c887b', fontStyle: 'italic' }}>
            🎉 Você está com as contas em dia! Nenhuma dívida pendente nesta viagem.
          </div>
        ) : (
          debts.map(debt => {
            const isExpanded = Boolean(expandedDebts[debt.creditorUserId]);
            return (
              <div key={debt.creditorUserId} className="debt-card">
                <div className="debt-card-header" onClick={() => toggleDebtExpand(debt.creditorUserId)}>
                  <div>
                    <span className="debt-creditor-name">Você deve para @{debt.creditorUsername}</span>
                    <div style={{ fontSize: '12px', color: '#8c887b', marginTop: '2px' }}>
                      {debt.details.length} {debt.details.length === 1 ? 'gasto dividido' : 'gastos divididos'} • Toque para ver detalhes
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="debt-amount-highlight">
                      R$ {debt.totalOwed.toFixed(2).replace('.', ',')}
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="#8c887b" /> : <ChevronDown size={18} color="#8c887b" />}
                  </div>
                </div>

                {/* Chave Pix do credor sempre no topo ao expandir */}
                {isExpanded && (
                  <div className="animate-slide-up">
                    <div className="creditor-pix-box">
                      <div>
                        <div className="creditor-pix-label">Chave Pix de @{debt.creditorUsername}:</div>
                        <div className="creditor-pix-value">
                          {debt.creditorPixKey || 'Chave não cadastrada pelo usuário'}
                        </div>
                      </div>
                      {debt.creditorPixKey && (
                        <button className="btn-copy-pix" onClick={() => handleCopyPix(debt.creditorPixKey)}>
                          <Copy size={13} />
                          <span>Copiar</span>
                        </button>
                      )}
                    </div>

                    {/* Detalhamento dos gastos */}
                    <div className="debt-details-table-wrapper">
                      <table className="debt-details-table">
                        <thead>
                          <tr>
                            <th>Item / Data</th>
                            <th>Total Gasto</th>
                            <th style={{ textAlign: 'right' }}>Sua Parte</th>
                          </tr>
                        </thead>
                        <tbody>
                          {debt.details.map(item => (
                            <tr key={item.expenseId}>
                              <td>
                                <div style={{ fontWeight: 600 }}>{item.description}</div>
                                <div style={{ fontSize: '11px', color: '#888' }}>
                                  {item.expenseDate}
                                </div>
                              </td>
                              <td>R$ {item.totalExpenseAmount.toFixed(2).replace('.', ',')}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: '#e07a5f' }}>
                                R$ {item.yourShareAmount.toFixed(2).replace('.', ',')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="debt-total-footer">
                        <span>Total a pagar para @{debt.creditorUsername}:</span>
                        <span style={{ color: '#e07a5f', fontSize: '16px' }}>
                          R$ {debt.totalOwed.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Seção 2: Histórico de Todos os Gastos da Viagem */}
      <div className="expenses-section-title" style={{ marginTop: '28px' }}>
        <Receipt size={18} color="#2a9d8f" />
        <span>Histórico de gastos da viagem ({expenses.length})</span>
      </div>

      <div className="debt-cards-list">
        {expenses.length === 0 ? (
          <div className="pix-user-card" style={{ textAlign: 'center', color: '#8c887b', fontStyle: 'italic' }}>
            Nenhum gasto registrado ainda. Clique no botão acima para adicionar.
          </div>
        ) : (
          expenses.map(exp => {
            const isMePayer = exp.paidByUserId === currentUserId;
            return (
              <div key={exp.id} className="debt-card" style={{ borderLeftColor: isMePayer ? '#2a9d8f' : '#89b4b1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{exp.description}</span>
                    <div style={{ fontSize: '12px', color: '#8c887b', marginTop: '2px' }}>
                      Pago por <strong>@{exp.paidByUsername} {isMePayer ? '(Você)' : ''}</strong> em {exp.expenseDate}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                      👥 Dividido entre {exp.splits.length} amigos: {exp.splits.map(s => `@${s.username}`).join(', ')}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '16px', color: isMePayer ? '#2a9d8f' : 'var(--text-dark)' }}>
                      R$ {exp.amount.toFixed(2).replace('.', ',')}
                    </span>
                    {isMePayer && (
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)} 
                        style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', padding: 4 }}
                        title="Excluir este gasto"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal / Portal Novo Gasto */}
      {isModalOpen && createPortal(
        <div className="modal-portal-overlay centered-mode" onClick={() => setIsModalOpen(false)}>
          <div className="expense-modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2>Registrar Gasto</h2>
              <button className="header-btn" onClick={() => setIsModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="form-error-banner animate-slide-up" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitExpense} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* O que foi gasto */}
              <div className="form-group">
                <label>O que foi gasto?</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ex: Mercado, Combustível, Churrasco, Aluguel..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              {/* Valor total e Dia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Valor Total (R$)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="0,00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data do Gasto</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={expenseDate}
                    onChange={e => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Rateio entre Participantes */}
              <div>
                <div className="splits-selection-header">
                  <label>Quem arcará com o rateio?</label>
                  <button type="button" className="btn-select-all-friends" onClick={handleSelectAllUsers}>
                    {selectedUserIds.length === validParticipants.length ? 'Desmarcar todos' : 'Adicionar todos'}
                  </button>
                </div>

                <div className="friends-checklist">
                  {validParticipants.map(participant => {
                    const isSelected = selectedUserIds.includes(participant.userId);
                    return (
                      <div 
                        key={participant.id} 
                        className={`friend-check-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleUser(participant.userId)}
                      >
                        <div className="friend-check-card-left">
                          <div className="friend-avatar-small">
                            {(participant.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <span className="friend-name-check">
                            {participant.name} {participant.userId === currentUserId ? '(Você)' : ''}
                          </span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => {}} 
                          style={{ cursor: 'pointer', width: 18, height: 18 }} 
                        />
                      </div>
                    );
                  })}
                </div>

                {parsedAmount > 0 && selectedUserIds.length > 0 && (
                  <div className="split-preview-badge">
                    Divisão: R$ {splitPerPerson} por pessoa ({selectedUserIds.length} selecionados)
                  </div>
                )}
              </div>

              {/* Botões do Formulário */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button 
                  type="submit" 
                  className="btn-new-expense" 
                  style={{ margin: 0, flex: 1 }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Gasto'}
                </button>
                <button 
                  type="button" 
                  className="btn-slot-back" 
                  onClick={() => setIsModalOpen(false)}
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
