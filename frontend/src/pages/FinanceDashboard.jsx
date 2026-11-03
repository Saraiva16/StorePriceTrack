import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard as CreditCardIcon,
  PieChart as PieChartIcon,
  List as ListIcon,
  Trash2,
  Calendar,
  AlertCircle,
  X,
  Check,
  Tag,
  DollarSign,
  Utensils,
  Home as HomeIcon,
  Car,
  Film,
  HeartPulse,
  GraduationCap,
  ShoppingBag,
  Briefcase,
  Laptop,
  PiggyBank,
  MoreHorizontal,
  Pencil
} from 'lucide-react';
import {
  fetchMonthlyTransactions,
  fetchMonthlySummary,
  createTransaction,
  deleteTransaction,
  fetchCreditCards,
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  fetchCategories,
  createCategory
} from '../services/FinanceService';
import { maskCurrencyInput, parseCurrencyToNumber, formatCurrency } from '../utils/currency';
import './FinanceDashboard.css';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CARD_COLORS = [
  '#89b4b1', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#1e293b'
];

// Mapeamento dinâmico de ícones Lucide
const getCategoryIconComponent = (iconName, size = 18, color = 'currentColor') => {
  const props = { size, color };
  switch (iconName) {
    case 'Utensils': return <Utensils {...props} />;
    case 'Home': return <HomeIcon {...props} />;
    case 'Car': return <Car {...props} />;
    case 'Film': return <Film {...props} />;
    case 'HeartPulse': return <HeartPulse {...props} />;
    case 'GraduationCap': return <GraduationCap {...props} />;
    case 'ShoppingBag': return <ShoppingBag {...props} />;
    case 'Briefcase': return <Briefcase {...props} />;
    case 'TrendingUp': return <TrendingUp {...props} />;
    case 'Laptop': return <Laptop {...props} />;
    case 'PiggyBank': return <PiggyBank {...props} />;
    default: return <Tag {...props} />;
  }
};

export default function FinanceDashboard() {
  const navigate = useNavigate();

  // Mês e Ano Selecionados (Default: mês corrente)
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);

  // Aba ativa: 'dashboard' | 'transactions' | 'cards'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dados da API
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    expenseByCategory: []
  });
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);

  // Estados de Carregamento e Mensagens
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modais
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [txToDelete, setTxToDelete] = useState(null);

  // Form Lançamento
  const [txType, setTxType] = useState('EXPENSE');
  const [txDesc, setTxDesc] = useState('');
  const [txAmountRaw, setTxAmountRaw] = useState('');
  const [txDate, setTxDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [txPaymentMethod, setTxPaymentMethod] = useState('CREDIT_CARD');
  const [txCardId, setTxCardId] = useState('');
  const [txCategoryId, setTxCategoryId] = useState('');
  const [txInstallments, setTxInstallments] = useState(1);
  const [txObservation, setTxObservation] = useState('');

  // Form Cartão
  const [cardName, setCardName] = useState('');
  const [cardBank, setCardBank] = useState('');
  const [cardLimitRaw, setCardLimitRaw] = useState('');
  const [cardClosingDay, setCardClosingDay] = useState(10);
  const [cardDueDay, setCardDueDay] = useState(17);
  const [cardColor, setCardColor] = useState(CARD_COLORS[0]);

  // Form Nova Categoria
  const [catName, setCatName] = useState('');
  const [catType, setCatType] = useState('EXPENSE');
  const [catColor, setCatColor] = useState('#89b4b1');
  const [catIcon, setCatIcon] = useState('Tag');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [sumRes, txsRes, cardsRes, catsRes] = await Promise.all([
        fetchMonthlySummary(currentYear, currentMonth),
        fetchMonthlyTransactions(currentYear, currentMonth),
        fetchCreditCards(),
        fetchCategories()
      ]);
      setSummary(sumRes);
      setTransactions(txsRes);
      setCards(cardsRes);
      setCategories(catsRes);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
      setErrorMessage(err.message || 'Falha ao carregar dados financeiros.');
    } finally {
      setIsLoading(false);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Navegação de mês
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  // Submissão de Transação
  const handleSaveTransaction = async (e) => {
    e.preventDefault();
    const amount = parseCurrencyToNumber(txAmountRaw);
    if (!amount || amount <= 0) {
      showToast('Informe um valor válido maior que zero.');
      return;
    }
    if (!txDesc.trim()) {
      showToast('Informe a descrição do lançamento.');
      return;
    }
    if (txType === 'EXPENSE' && txPaymentMethod === 'CREDIT_CARD' && !txCardId) {
      showToast('Selecione o cartão de crédito utilizado.');
      return;
    }

    try {
      await createTransaction({
        description: txDesc.trim(),
        amount,
        type: txType,
        transactionDate: txDate,
        paymentMethod: txType === 'INCOME' ? 'PIX' : txPaymentMethod,
        creditCardId: txType === 'EXPENSE' && txPaymentMethod === 'CREDIT_CARD' ? Number(txCardId) : null,
        categoryId: txCategoryId ? Number(txCategoryId) : null,
        totalInstallments: txType === 'EXPENSE' && txPaymentMethod === 'CREDIT_CARD' ? Number(txInstallments) : 1,
        observation: txObservation.trim() || null
      });

      showToast('Lançamento registrado com sucesso!');
      setIsTxModalOpen(false);
      setTxDesc('');
      setTxAmountRaw('');
      setTxObservation('');
      setTxInstallments(1);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao registrar lançamento.');
    }
  };

  // Exclusão de Transação
  const handleConfirmDeleteTx = async (deleteAll) => {
    if (!txToDelete) return;
    try {
      await deleteTransaction(txToDelete.id, deleteAll);
      showToast(deleteAll ? 'Todas as parcelas foram excluídas.' : 'Lançamento excluído com sucesso.');
      setTxToDelete(null);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir lançamento.');
    }
  };

  const openNewCardModal = () => {
    setEditingCardId(null);
    setCardName('');
    setCardBank('');
    setCardLimitRaw('');
    setCardClosingDay(10);
    setCardDueDay(17);
    setCardColor(CARD_COLORS[0]);
    setIsCardModalOpen(true);
  };

  const openEditCardModal = (card) => {
    setEditingCardId(card.id);
    setCardName(card.name || '');
    setCardBank(card.bank || '');
    setCardLimitRaw(formatCurrency(card.creditLimit));
    setCardClosingDay(card.closingDay || 10);
    setCardDueDay(card.dueDay || 17);
    setCardColor(card.color || CARD_COLORS[0]);
    setIsCardModalOpen(true);
  };

  // Submissão de Cartão de Crédito (Criar ou Atualizar)
  const handleSaveCard = async (e) => {
    e.preventDefault();
    const limit = parseCurrencyToNumber(cardLimitRaw);
    if (!limit || limit <= 0) {
      showToast('Informe um limite de crédito válido.');
      return;
    }
    if (!cardName.trim() || !cardBank.trim()) {
      showToast('Informe o nome e banco do cartão.');
      return;
    }

    try {
      const cardPayload = {
        name: cardName.trim(),
        bank: cardBank.trim(),
        creditLimit: limit,
        closingDay: Number(cardClosingDay),
        dueDay: Number(cardDueDay),
        color: cardColor
      };

      if (editingCardId) {
        await updateCreditCard(editingCardId, cardPayload);
        showToast('Cartão de crédito atualizado com sucesso!');
      } else {
        await createCreditCard(cardPayload);
        showToast('Cartão de crédito cadastrado com sucesso!');
      }

      setIsCardModalOpen(false);
      setEditingCardId(null);
      setCardName('');
      setCardBank('');
      setCardLimitRaw('');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao salvar cartão.');
    }
  };

  // Exclusão de Cartão
  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Tem certeza que deseja excluir este cartão?')) return;
    try {
      await deleteCreditCard(cardId);
      showToast('Cartão excluído com sucesso.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Erro ao excluir cartão.');
    }
  };

  // Submissão de Categoria Customizada
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Informe o nome da categoria.');
      return;
    }
    try {
      const created = await createCategory({
        name: catName.trim(),
        type: catType,
        color: catColor,
        icon: catIcon
      });
      showToast('Categoria criada com sucesso!');
      setIsCategoryModalOpen(false);
      setCatName('');
      setCategories((prev) => [...prev, created]);
      setTxCategoryId(String(created.id));
    } catch (err) {
      showToast(err.message || 'Erro ao criar categoria.');
    }
  };

  // Cálculo dos arcos do Gráfico Donut em SVG Nativo
  const donutSlices = useMemo(() => {
    const list = summary?.expenseByCategory || [];
    if (!list.length || Number(summary.totalExpense) <= 0) return [];

    let currentOffset = 25; // Inicia no topo (12 horas)
    return list.map((item) => {
      const pct = item.percentage;
      const strokeDasharray = `${pct} ${100 - pct}`;
      const strokeDashoffset = currentOffset;
      currentOffset -= pct;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset
      };
    });
  }, [summary]);

  return (
    <div className="finance-container animate-slide-up">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="finance-toast" role="alert">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="finance-header">
        <button
          className="icon-btn"
          onClick={() => navigate('/home')}
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="header-title">Controle Financeiro</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* Navegador de Mês */}
      <div className="month-navigator">
        <button className="nav-arrow" onClick={handlePrevMonth} aria-label="Mês anterior">
          <ChevronLeft size={22} />
        </button>
        <div className="month-display">
          <Calendar size={18} className="calendar-icon" />
          <span className="month-text">
            {MONTH_NAMES[currentMonth - 1]} {currentYear}
          </span>
        </div>
        <button className="nav-arrow" onClick={handleNextMonth} aria-label="Próximo mês">
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Cards de Balanço do Mês */}
      <section className="balance-grid">
        <div className="balance-card income-card">
          <div className="card-top">
            <span className="card-label">Receitas</span>
            <div className="badge-icon income-badge">
              <TrendingUp size={16} />
            </div>
          </div>
          <span className="card-value income-value">
            R$ {formatCurrency(summary.totalIncome)}
          </span>
        </div>

        <div className="balance-card expense-card">
          <div className="card-top">
            <span className="card-label">Despesas</span>
            <div className="badge-icon expense-badge">
              <TrendingDown size={16} />
            </div>
          </div>
          <span className="card-value expense-value">
            R$ {formatCurrency(summary.totalExpense)}
          </span>
        </div>

        <div className="balance-card total-card">
          <div className="card-top">
            <span className="card-label">Balanço do Mês</span>
            <div className="badge-icon total-badge">
              <Wallet size={16} />
            </div>
          </div>
          <span
            className={`card-value ${
              Number(summary.balance) >= 0 ? 'balance-positive' : 'balance-negative'
            }`}
          >
            {Number(summary.balance) < 0 ? '- ' : ''}R$ {formatCurrency(Math.abs(summary.balance))}
          </span>
        </div>
      </section>

      {/* Conteúdo da Aba Ativa */}
      <main className="tab-content">
        {errorMessage && (
          <div className="error-banner">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Carregando dados financeiros...</p>
          </div>
        ) : (
          <>
            {/* ABA 1: GRÁFICOS E RESUMO */}
            {activeTab === 'dashboard' && (
              <div className="dashboard-view animate-fade-in">
                {/* Gráfico Donut de Despesas por Categoria */}
                <div className="chart-box">
                  <h3 className="box-title">Gastos por Categoria</h3>
                  {donutSlices.length > 0 ? (
                    <div className="donut-wrapper">
                      <div className="donut-chart-container">
                        <svg viewBox="0 0 42 42" className="donut-svg" aria-label="Gráfico de rosca por categorias">
                          {/* Anel de fundo */}
                          <circle
                            cx="21"
                            cy="21"
                            r="15.915494309189533"
                            fill="transparent"
                            stroke="#e2e8f0"
                            strokeWidth="5"
                          />
                          {/* Fatias */}
                          {donutSlices.map((slice) => (
                            <circle
                              key={slice.categoryId}
                              cx="21"
                              cy="21"
                              r="15.915494309189533"
                              fill="transparent"
                              stroke={slice.color || '#89b4b1'}
                              strokeWidth="5"
                              strokeDasharray={slice.strokeDasharray}
                              strokeDashoffset={slice.strokeDashoffset}
                            />
                          ))}
                        </svg>
                        <div className="donut-center-info">
                          <span className="donut-center-label">Total Gasto</span>
                          <span className="donut-center-value">
                            R$ {formatCurrency(summary.totalExpense)}
                          </span>
                        </div>
                      </div>

                      {/* Legenda das Categorias */}
                      <div className="donut-legend">
                        {donutSlices.map((slice) => (
                          <div key={slice.categoryId} className="legend-row">
                            <div className="legend-left">
                              <span
                                className="legend-bullet"
                                style={{ backgroundColor: slice.color || '#89b4b1' }}
                              />
                              <span className="legend-name">{slice.categoryName}</span>
                            </div>
                            <div className="legend-right">
                              <span className="legend-amount">
                                R$ {formatCurrency(slice.totalAmount)}
                              </span>
                              <span className="legend-pct">{slice.percentage}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="empty-chart">
                      <PiggyBank size={48} color="#94a3b8" />
                      <p>Nenhuma despesa registrada para {MONTH_NAMES[currentMonth - 1]}.</p>
                    </div>
                  )}
                </div>

                {/* Comparativo de Barras: Receitas vs Despesas */}
                <div className="chart-box">
                  <h3 className="box-title">Fluxo Mensal (Receitas vs Despesas)</h3>
                  <div className="bars-comparison">
                    <div className="bar-group">
                      <div className="bar-header">
                        <span className="bar-name">Receitas</span>
                        <span className="bar-value income-value">
                          R$ {formatCurrency(summary.totalIncome)}
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill income-fill"
                          style={{
                            width: `${
                              Math.max(Number(summary.totalIncome), Number(summary.totalExpense)) > 0
                                ? (Number(summary.totalIncome) /
                                    Math.max(Number(summary.totalIncome), Number(summary.totalExpense))) *
                                  100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>

                    <div className="bar-group">
                      <div className="bar-header">
                        <span className="bar-name">Despesas</span>
                        <span className="bar-value expense-value">
                          R$ {formatCurrency(summary.totalExpense)}
                        </span>
                      </div>
                      <div className="bar-track">
                        <div
                          className="bar-fill expense-fill"
                          style={{
                            width: `${
                              Math.max(Number(summary.totalIncome), Number(summary.totalExpense)) > 0
                                ? (Number(summary.totalExpense) /
                                    Math.max(Number(summary.totalIncome), Number(summary.totalExpense))) *
                                  100
                                : 0
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA 2: LISTA DE LANÇAMENTOS */}
            {activeTab === 'transactions' && (
              <div className="transactions-view animate-fade-in">
                <div className="transactions-header-vertical">
                  <h3 className="box-title mb-0">Histórico de Lançamentos</h3>
                  <button
                    className="add-tx-full-btn"
                    onClick={() => setIsTxModalOpen(true)}
                  >
                    <Plus size={16} /> Novo Lançamento
                  </button>
                </div>

                {transactions.length === 0 ? (
                  <div className="empty-list">
                    <ListIcon size={44} color="#94a3b8" />
                    <p>Nenhum lançamento encontrado neste mês.</p>
                    <button
                      className="cta-btn"
                      onClick={() => setIsTxModalOpen(true)}
                    >
                      Registrar Primeiro Lançamento
                    </button>
                  </div>
                ) : (
                  <div className="tx-list">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="tx-item">
                        <div
                          className="tx-icon-wrapper"
                          style={{
                            backgroundColor: `${tx.categoryColor || '#89b4b1'}20`,
                            color: tx.categoryColor || '#89b4b1'
                          }}
                        >
                          {getCategoryIconComponent(tx.categoryIcon, 20, tx.categoryColor || '#89b4b1')}
                        </div>

                        <div className="tx-info">
                          <div className="tx-main-row">
                            <span className="tx-desc">{tx.description}</span>
                            <span
                              className={`tx-amount ${
                                tx.type === 'INCOME' ? 'income-amount' : 'expense-amount'
                              }`}
                            >
                              {tx.type === 'INCOME' ? '+ ' : '- '}R$ {formatCurrency(tx.amount)}
                            </span>
                          </div>

                          <div className="tx-sub-row">
                            <span className="tx-meta-date">{tx.transactionDate}</span>
                            {tx.categoryName && (
                              <span className="tx-badge-cat">{tx.categoryName}</span>
                            )}
                            {tx.paymentMethod === 'CREDIT_CARD' && (
                              <span className="tx-badge-card">
                                💳 {tx.creditCardName || 'Cartão'}
                                {tx.totalInstallments > 1 && ` (${tx.installmentNumber}/${tx.totalInstallments})`}
                              </span>
                            )}
                            {tx.paymentMethod !== 'CREDIT_CARD' && (
                              <span className="tx-badge-method">{tx.paymentMethod}</span>
                            )}
                          </div>
                        </div>

                        <button
                          className="delete-tx-btn"
                          onClick={() => setTxToDelete(tx)}
                          aria-label={`Excluir lançamento ${tx.description}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ABA 3: CARTÕES DE CRÉDITO */}
            {activeTab === 'cards' && (
              <div className="cards-view animate-fade-in">
                <div className="cards-header-vertical">
                  <h3 className="box-title mb-0">Meus Cartões de Crédito</h3>
                  <button
                    className="add-card-full-btn"
                    onClick={openNewCardModal}
                  >
                    <Plus size={16} /> Novo Cartão
                  </button>
                </div>

                {cards.length === 0 ? (
                  <div className="empty-list">
                    <CreditCardIcon size={44} color="#94a3b8" />
                    <p>Você ainda não cadastrou nenhum cartão de crédito.</p>
                    <button
                      className="cta-btn"
                      onClick={openNewCardModal}
                    >
                      Cadastrar Primeiro Cartão
                    </button>
                  </div>
                ) : (
                  <div className="cards-grid">
                    {cards.map((card) => {
                      const usedPct =
                        Number(card.creditLimit) > 0
                          ? Math.min((Number(card.usedLimit) / Number(card.creditLimit)) * 100, 100)
                          : 0;

                      return (
                        <div
                          key={card.id}
                          className="credit-card-item"
                          style={{
                            background: `linear-gradient(135deg, ${card.color || '#1e293b'} 0%, #0f172a 100%)`
                          }}
                        >
                          <div className="card-top-row">
                            <span className="card-bank">{card.bank}</span>
                            <div className="card-actions-row">
                              <button
                                className="card-action-icon"
                                onClick={() => openEditCardModal(card)}
                                aria-label={`Editar cartão ${card.name}`}
                              >
                                <Pencil size={15} color="rgba(255,255,255,0.85)" />
                              </button>
                              <button
                                className="card-action-icon card-delete-icon"
                                onClick={() => handleDeleteCard(card.id)}
                                aria-label={`Excluir cartão ${card.name}`}
                              >
                                <Trash2 size={15} color="rgba(255,255,255,0.85)" />
                              </button>
                            </div>
                          </div>

                          <div className="card-mid-row">
                            <CreditCardIcon size={28} color="rgba(255,255,255,0.9)" />
                            <span className="card-name-title">{card.name}</span>
                          </div>

                          <div className="card-limit-progress">
                            <div className="limit-labels">
                              <span>Disponível: R$ {formatCurrency(card.availableLimit)}</span>
                              <span>Total: R$ {formatCurrency(card.creditLimit)}</span>
                            </div>
                            <div className="limit-track">
                              <div
                                className="limit-fill"
                                style={{ width: `${usedPct}%` }}
                              />
                            </div>
                          </div>

                          <div className="card-footer-dates">
                            <div className="date-item">
                              <span className="date-label">Fecha dia</span>
                              <span className="date-val">{card.closingDay}</span>
                            </div>
                            <div className="date-item">
                              <span className="date-label">Vence dia</span>
                              <span className="date-val">{card.dueDay}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Bottom Bar Fixa */}
      <footer className="finance-bottom-bar-container">
        <div className="finance-bottom-bar">
          <button
            className="finance-bar-item"
            onClick={() => navigate('/home')}
            aria-label="Ir para a página inicial"
          >
            <HomeIcon size={24} />
            <span>Início</span>
          </button>

          <button
            className={`finance-bar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            aria-label="Ver gráficos e resumo"
          >
            <PieChartIcon size={24} />
            <span>Gráficos</span>
          </button>

          {/* Botão Central FAB */}
          <button
            className="finance-bar-fab"
            onClick={() => setIsTxModalOpen(true)}
            aria-label="Adicionar novo lançamento"
          >
            <div className="finance-bar-fab-inner">
              <Plus size={30} color="white" />
            </div>
          </button>

          <button
            className={`finance-bar-item ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
            aria-label="Ver lançamentos"
          >
            <ListIcon size={24} />
            <span>Lançamentos</span>
          </button>

          <button
            className={`finance-bar-item ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
            aria-label="Ver cartões"
          >
            <CreditCardIcon size={24} />
            <span>Cartões</span>
          </button>
        </div>
      </footer>

      {/* MODAL: NOVO LANÇAMENTO */}
      {isTxModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsTxModalOpen(false)}>
          <div className="modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Novo Lançamento</h2>
              <button className="icon-btn-close" onClick={() => setIsTxModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="modal-form">
              {/* Type Toggle */}
              <div className="type-toggle-group">
                <button
                  type="button"
                  className={`type-btn expense-btn ${txType === 'EXPENSE' ? 'active' : ''}`}
                  onClick={() => setTxType('EXPENSE')}
                >
                  <TrendingDown size={18} /> Despesa
                </button>
                <button
                  type="button"
                  className={`type-btn income-btn ${txType === 'INCOME' ? 'active' : ''}`}
                  onClick={() => setTxType('INCOME')}
                >
                  <TrendingUp size={18} /> Receita
                </button>
              </div>

              {/* Valor */}
              <div className="form-group">
                <label htmlFor="tx-amount">Valor (R$)</label>
                <div className="currency-input-wrapper">
                  <span className="currency-prefix">R$</span>
                  <input
                    id="tx-amount"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={txAmountRaw}
                    onChange={(e) => setTxAmountRaw(maskCurrencyInput(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="form-group">
                <label htmlFor="tx-desc">Descrição</label>
                <input
                  id="tx-desc"
                  type="text"
                  placeholder="Ex: Mercado, Salário, Cinema..."
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  required
                />
              </div>

              {/* Data */}
              <div className="form-group">
                <label htmlFor="tx-date">Data da Transação</label>
                <input
                  id="tx-date"
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                />
              </div>

              {/* Categoria */}
              <div className="form-group">
                <div className="label-with-action">
                  <label htmlFor="tx-category">Categoria</label>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setIsCategoryModalOpen(true)}
                  >
                    + Nova
                  </button>
                </div>
                <select
                  id="tx-category"
                  value={txCategoryId}
                  onChange={(e) => setTxCategoryId(e.target.value)}
                >
                  <option value="">Selecione uma categoria (opcional)</option>
                  {categories
                    .filter((c) => c.type === txType)
                    .map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Forma de Pagamento (somente para Despesas) */}
              {txType === 'EXPENSE' && (
                <>
                  <div className="form-group">
                    <label htmlFor="tx-method">Forma de Pagamento</label>
                    <select
                      id="tx-method"
                      value={txPaymentMethod}
                      onChange={(e) => setTxPaymentMethod(e.target.value)}
                    >
                      <option value="CREDIT_CARD">Cartão de Crédito</option>
                      <option value="PIX">PIX</option>
                      <option value="DEBIT_CARD">Cartão de Débito</option>
                      <option value="CASH">Dinheiro</option>
                      <option value="TRANSFER">Transferência</option>
                      <option value="OTHER">Outro</option>
                    </select>
                  </div>

                  {/* Se for Cartão de Crédito: Seleção de Cartão e Parcelas */}
                  {txPaymentMethod === 'CREDIT_CARD' && (
                    <>
                      <div className="form-group">
                        <div className="label-with-action">
                          <label htmlFor="tx-card">Cartão Utilizado</label>
                          <button
                            type="button"
                            className="link-btn"
                            onClick={openNewCardModal}
                          >
                            + Novo Cartão
                          </button>
                        </div>
                        <select
                          id="tx-card"
                          value={txCardId}
                          onChange={(e) => setTxCardId(e.target.value)}
                          required
                        >
                          <option value="">Selecione um cartão</option>
                          {cards.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.bank}) - Disp: R$ {formatCurrency(c.availableLimit)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="tx-installments">Parcelamento</label>
                        <select
                          id="tx-installments"
                          value={txInstallments}
                          onChange={(e) => setTxInstallments(Number(e.target.value))}
                        >
                          <option value={1}>1x (À vista na fatura)</option>
                          {Array.from({ length: 23 }, (_, i) => i + 2).map((n) => (
                            <option key={n} value={n}>
                              {n}x de R${' '}
                              {txAmountRaw
                                ? formatCurrency(parseCurrencyToNumber(txAmountRaw) / n)
                                : '0,00'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Observações */}
              <div className="form-group">
                <label htmlFor="tx-obs">Observações (opcional)</label>
                <textarea
                  id="tx-obs"
                  rows={2}
                  placeholder="Anotações extras sobre este gasto..."
                  value={txObservation}
                  onChange={(e) => setTxObservation(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsTxModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO / EDITAR CARTÃO DE CRÉDITO */}
      {isCardModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCardModalOpen(false)}>
          <div className="modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCardId ? 'Editar Cartão de Crédito' : 'Cadastrar Cartão de Crédito'}</h2>
              <button className="icon-btn-close" onClick={() => setIsCardModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="modal-form">
              <div className="form-group">
                <label htmlFor="card-name">Apelido do Cartão</label>
                <input
                  id="card-name"
                  type="text"
                  placeholder="Ex: Nubank Roxo, Inter Black..."
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-bank">Banco Emissor</label>
                <input
                  id="card-bank"
                  type="text"
                  placeholder="Ex: Nubank, Itaú, Bradesco..."
                  value={cardBank}
                  onChange={(e) => setCardBank(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="card-limit">Limite Total de Crédito (R$)</label>
                <div className="currency-input-wrapper">
                  <span className="currency-prefix">R$</span>
                  <input
                    id="card-limit"
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={cardLimitRaw}
                    onChange={(e) => setCardLimitRaw(maskCurrencyInput(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="card-closing">Dia Fechamento</label>
                  <input
                    id="card-closing"
                    type="number"
                    min={1}
                    max={31}
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="card-due">Dia Vencimento</label>
                  <input
                    id="card-due"
                    type="number"
                    min={1}
                    max={31}
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Cor do Cartão</label>
                <div className="color-picker-row">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-bubble ${cardColor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setCardColor(c)}
                      aria-label={`Cor ${c}`}
                    >
                      {cardColor === c && <Check size={14} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsCardModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingCardId ? 'Salvar Alterações' : 'Cadastrar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVA CATEGORIA */}
      {isCategoryModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nova Categoria Personalizada</h2>
              <button className="icon-btn-close" onClick={() => setIsCategoryModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="modal-form">
              <div className="form-group">
                <label htmlFor="cat-name">Nome da Categoria</label>
                <input
                  id="cat-name"
                  type="text"
                  placeholder="Ex: Assinaturas, Pets, Farmácia..."
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tipo</label>
                <div className="type-toggle-group">
                  <button
                    type="button"
                    className={`type-btn ${catType === 'EXPENSE' ? 'active' : ''}`}
                    onClick={() => setCatType('EXPENSE')}
                  >
                    Despesa
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${catType === 'INCOME' ? 'active' : ''}`}
                    onClick={() => setCatType('INCOME')}
                  >
                    Receita
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Cor</label>
                <div className="color-picker-row">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-bubble ${catColor === c ? 'selected' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setCatColor(c)}
                      aria-label={`Cor ${c}`}
                    >
                      {catColor === c && <Check size={14} color="white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsCategoryModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Criar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAÇÃO DE EXCLUSÃO (PARCELADA VS ÚNICA) */}
      {txToDelete && (
        <div className="modal-backdrop" onClick={() => setTxToDelete(null)}>
          <div className="modal-card animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmar Exclusão</h2>
              <button className="icon-btn-close" onClick={() => setTxToDelete(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p>
                Deseja excluir o lançamento <strong>"{txToDelete.description}"</strong> no valor de{' '}
                <strong>R$ {formatCurrency(txToDelete.amount)}</strong>?
              </p>

              {txToDelete.totalInstallments > 1 && (
                <div className="installment-warning-box">
                  <AlertCircle size={20} color="#e07a5f" />
                  <p>
                    Esta é a parcela <strong>{txToDelete.installmentNumber}</strong> de{' '}
                    <strong>{txToDelete.totalInstallments}</strong>. Escolha como deseja prosseguir:
                  </p>
                </div>
              )}
            </div>

            <div className="modal-actions-column">
              {txToDelete.totalInstallments > 1 ? (
                <>
                  <button
                    type="button"
                    className="btn-danger-outline"
                    onClick={() => handleConfirmDeleteTx(false)}
                  >
                    Excluir apenas esta parcela ({txToDelete.installmentNumber}/{txToDelete.totalInstallments})
                  </button>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => handleConfirmDeleteTx(true)}
                  >
                    Excluir todas as {txToDelete.totalInstallments} parcelas
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleConfirmDeleteTx(false)}
                >
                  Confirmar Exclusão
                </button>
              )}
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setTxToDelete(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
