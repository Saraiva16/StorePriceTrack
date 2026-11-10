import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import TripList from '../pages/TripList';
import Profile from '../pages/Profile';
import Home from '../pages/Home';
import FinanceDashboard from '../pages/FinanceDashboard';
import EstimatePurchase from '../pages/EstimatePurchase';

// Mock do AuthContext
vi.mock('../components/Auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 5, username: 'Mateus Saraiva Silva', email: 'mateus@example.com', pixKey: '123' },
    logout: vi.fn(),
    updatePixKey: vi.fn(),
    updateUserData: vi.fn()
  })
}));

// Mock dos serviços de API
vi.mock('../services/TripService', () => ({
  getTrips: vi.fn().mockResolvedValue([
    {
      id: 1,
      destination: 'Caraguatatuba',
      status: 'active',
      startDate: '2026-11-20',
      startTime: '08:00',
      endDate: '2026-11-22',
      endTime: '18:00',
      peopleCount: 4,
      createdByUserId: 5
    },
    {
      id: 2,
      destination: 'Ubatuba',
      status: 'completed',
      startDate: '2026-01-10',
      startTime: '08:00',
      endDate: '2026-01-12',
      endTime: '18:00',
      peopleCount: 2,
      createdByUserId: 5
    }
  ]),
  createTrip: vi.fn(),
  validateTripData: vi.fn().mockReturnValue({ isValid: true, errors: {} }),
  deleteTrip: vi.fn().mockResolvedValue(true)
}));

vi.mock('../services/UserService', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({
    id: 5,
    username: 'Mateus Saraiva Silva',
    pixKey: '123'
  }),
  updateUserProfile: vi.fn().mockResolvedValue({
    id: 5,
    username: 'Mateus Saraiva Silva',
    pixKey: '123'
  }),
  changeUserPassword: vi.fn().mockResolvedValue({ message: 'OK' })
}));

vi.mock('../services/FinanceService', () => ({
  fetchMonthlySummary: vi.fn().mockResolvedValue({
    year: 2026,
    month: 11,
    totalIncome: 5000.0,
    totalExpense: 1200.0,
    balance: 3800.0,
    expenseByCategory: [
      {
        categoryId: 1,
        categoryName: 'Alimentação',
        color: '#f59c8d',
        icon: 'Utensils',
        totalAmount: 800.0,
        percentage: 66.7
      },
      {
        categoryId: 2,
        categoryName: 'Transporte',
        color: '#eab676',
        icon: 'Car',
        totalAmount: 400.0,
        percentage: 33.3
      }
    ]
  }),
  fetchMonthlyTransactions: vi.fn().mockResolvedValue([
    {
      id: 1,
      description: 'Supermercado Central',
      amount: 800.0,
      type: 'EXPENSE',
      transactionDate: '2026-11-10',
      invoiceDate: '2026-11-10',
      paymentMethod: 'CREDIT_CARD',
      creditCardName: 'Nubank',
      categoryName: 'Alimentação',
      categoryColor: '#f59c8d',
      categoryIcon: 'Utensils',
      installmentNumber: 1,
      totalInstallments: 1
    }
  ]),
  fetchCreditCards: vi.fn().mockResolvedValue([
    {
      id: 10,
      name: 'Nubank Ultravioleta',
      bank: 'Nubank',
      creditLimit: 3000.0,
      usedLimit: 800.0,
      availableLimit: 2200.0,
      closingDay: 10,
      dueDay: 17,
      color: '#8b5cf6'
    }
  ]),
  fetchCategories: vi.fn().mockResolvedValue([
    { id: 1, name: 'Alimentação', type: 'EXPENSE', color: '#f59c8d', icon: 'Utensils', custom: false },
    { id: 2, name: 'Transporte', type: 'EXPENSE', color: '#eab676', icon: 'Car', custom: false },
    { id: 9, name: 'Salário', type: 'INCOME', color: '#2ecc71', icon: 'Briefcase', custom: false }
  ]),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn().mockResolvedValue({ id: 1 }),
  deleteTransaction: vi.fn(),
  createCreditCard: vi.fn(),
  deleteCreditCard: vi.fn(),
  createCategory: vi.fn()
}));

describe('Validação de Renderização de Telas Frontend', () => {
  it('deve renderizar a tela TripList sem erros de runtime', async () => {
    const { findByText } = render(
      <BrowserRouter>
        <TripList />
      </BrowserRouter>
    );

    expect(await findByText('Viagens e Eventos')).toBeInTheDocument();
    expect(await findByText('Mostrar viagens já concluídas')).toBeInTheDocument();
  });

  it('deve renderizar a tela Profile sem erros de runtime', async () => {
    const { findByText } = render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    expect(await findByText('Meu Perfil')).toBeInTheDocument();
    expect(await findByText('Dados Cadastrais')).toBeInTheDocument();
    expect(await findByText('Segurança e Senha')).toBeInTheDocument();
    expect(await findByText('Versão do Sistema')).toBeInTheDocument();
    expect(await findByText('Recarregar App')).toBeInTheDocument();
  });

  it('deve renderizar o header personalizado e permitir alternar modo de edição na Home', async () => {
    const { findByText, getByRole } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(await findByText(/Olá,/i)).toBeInTheDocument();
    expect(await findByText(/Mateus/i)).toBeInTheDocument();

    const editButton = getByRole('button', { name: /Editar cards visíveis/i });
    expect(editButton).toBeInTheDocument();
  });

  it('deve renderizar o novo card de Controle Financeiro na Home', async () => {
    const { findByText } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(await findByText(/Controle/i)).toBeInTheDocument();
    expect(await findByText(/Gerencie despesas, receitas e faturas de cartão/i)).toBeInTheDocument();
  });

  it('deve renderizar a tela FinanceDashboard com cards, gráficos e abas sem erros de runtime', async () => {
    const { findByText, findAllByText } = render(
      <BrowserRouter>
        <FinanceDashboard />
      </BrowserRouter>
    );

    // Valida Header e Balanços
    expect(await findByText('Controle Financeiro')).toBeInTheDocument();
    const incomeLabels = await findAllByText('Receitas');
    expect(incomeLabels.length).toBeGreaterThanOrEqual(1);

    const expenseLabels = await findAllByText('Despesas');
    expect(expenseLabels.length).toBeGreaterThanOrEqual(1);

    expect(await findByText('Balanço do Mês')).toBeInTheDocument();

    // Valida Abas
    expect(await findByText('Gráficos')).toBeInTheDocument();
    expect(await findByText(/Lançamentos/i)).toBeInTheDocument();
    expect(await findByText(/Cartões/i)).toBeInTheDocument();

    // Valida Seção de Gráficos e Categorias
    expect(await findByText('Gastos por Categoria')).toBeInTheDocument();
    expect(await findByText('Alimentação')).toBeInTheDocument();
    expect(await findByText('Transporte')).toBeInTheDocument();
    expect(await findByText('Fluxo Mensal (Receitas vs Despesas)')).toBeInTheDocument();
  });

  it('deve abrir automaticamente o modal de Novo Lançamento preenchido ao receber parâmetros do Atalho do iOS', async () => {
    const { findByText, container, findByDisplayValue } = render(
      <MemoryRouter initialEntries={['/finance?amount=45.90&category=Alimentação']}>
        <FinanceDashboard />
      </MemoryRouter>
    );

    // Deve abrir o modal de Novo Lançamento automaticamente
    expect(await findByText('Novo Lançamento')).toBeInTheDocument();

    // Deve ter preenchido o valor formatado 45,90
    expect(await findByDisplayValue('45,90')).toBeInTheDocument();

    // Deve ter a categoria Alimentação selecionada (id 1)
    const categorySelect = container.querySelector('#tx-category');
    expect(categorySelect).not.toBeNull();
    expect(categorySelect.value).toBe('1');
  });

  it('deve normalizar emojis e sinônimos como Comida para a categoria Alimentação', async () => {
    const { findByText, container, findByDisplayValue } = render(
      <MemoryRouter initialEntries={['/finance?amount=50.00&category=Comida%20%F0%9F%8D%94']}>
        <FinanceDashboard />
      </MemoryRouter>
    );

    expect(await findByText('Novo Lançamento')).toBeInTheDocument();
    expect(await findByDisplayValue('50,00')).toBeInTheDocument();
    const categorySelect = container.querySelector('#tx-category');
    expect(categorySelect).not.toBeNull();
    expect(categorySelect.value).toBe('1');
  });

  it('deve processar parâmetros do Apple Pay com prefixo monetário, comerciante e cartão', async () => {
    const { findByText, container, findByDisplayValue } = render(
      <MemoryRouter initialEntries={['/finance?amount=R$%2089,90&desc=Padaria%20Central&card=Nubank']}>
        <FinanceDashboard />
      </MemoryRouter>
    );

    expect(await findByText('Novo Lançamento')).toBeInTheDocument();
    expect(await findByDisplayValue('89,90')).toBeInTheDocument();
    expect(await findByDisplayValue('Padaria Central')).toBeInTheDocument();
    const cardSelect = container.querySelector('#tx-card');
    expect(cardSelect).not.toBeNull();
    expect(cardSelect.value).toBe('10'); // Nubank Ultravioleta mockado com id 10
  });

  it('deve renderizar a tela EstimatePurchase com mercados e produtos sem erros de runtime', async () => {
    // Mock do fetch global para os endpoints da tela de estimativa
    global.fetch = vi.fn().mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/api/markets/networks')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['Supermercado Extra', 'Pão de Açúcar'])
        });
      }
      if (typeof url === 'string' && url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            content: [
              { id: 1, normalizedName: 'Arroz Tio João 5kg', categoryName: 'Mercearia' },
              { id: 2, normalizedName: 'Feijão Carioca 1kg', categoryName: 'Mercearia' }
            ]
          })
        });
      }
      if (typeof url === 'string' && url.includes('/api/estimate/recalculate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            'Arroz Tio João 5kg': 25.90,
            'Feijão Carioca 1kg': 8.50
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });

    const { findByText, findAllByText, getByPlaceholderText } = render(
      <BrowserRouter>
        <EstimatePurchase />
      </BrowserRouter>
    );

    expect(await findByText('Estimativa Pessoal')).toBeInTheDocument();
    expect(getByPlaceholderText('Adicionar novo produto...')).toBeInTheDocument();
    const marketOptions = await findAllByText('Supermercado Extra');
    expect(marketOptions.length).toBeGreaterThanOrEqual(1);
    expect(await findByText('Fechar carrinho?')).toBeInTheDocument();
  });

  it('deve permitir abrir o modal de edição ao clicar no ícone de lápis em um lançamento', async () => {
    const { findByText, findByDisplayValue } = render(
      <BrowserRouter>
        <FinanceDashboard />
      </BrowserRouter>
    );

    // Clica na aba de Lançamentos
    const txTabs = await screen.findAllByText(/Lançamentos/i);
    expect(txTabs.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(txTabs[0]);

    // Encontra o botão de editar do lançamento
    const editBtn = await screen.findByRole('button', { name: /Editar lançamento Supermercado Central/i });
    fireEvent.click(editBtn);

    // Valida que o modal abriu com título Editar Lançamento e valor preenchido
    expect(await findByText('Editar Lançamento')).toBeInTheDocument();
    expect(await findByDisplayValue('800,00')).toBeInTheDocument();
    expect(await findByDisplayValue('Supermercado Central')).toBeInTheDocument();
    expect(await findByText('Salvar Alterações')).toBeInTheDocument();
  });
});
