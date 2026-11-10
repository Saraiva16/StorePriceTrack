import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import Home from '../pages/Home';

// Mocks
const mockUser = { id: 1, username: 'Malu', email: null, pixKey: '' };

vi.mock('../components/Auth/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    login: vi.fn().mockResolvedValue(true),
    logout: vi.fn(),
    updatePixKey: vi.fn(),
    updateUserData: vi.fn()
  })
}));

vi.mock('../services/UserService', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    username: 'Malu',
    email: 'malu@exemplo.com',
    pixKey: '123'
  }),
  updateUserProfile: vi.fn().mockResolvedValue({
    id: 1,
    username: 'Malu',
    email: 'malu@exemplo.com',
    pixKey: '123'
  }),
  changeUserPassword: vi.fn().mockResolvedValue({ message: 'OK' })
}));

vi.mock('../services/FinanceService', () => ({
  fetchMonthlySummary: vi.fn().mockResolvedValue({ totalExpense: 150.0 }),
  fetchMonthlyTransactions: vi.fn().mockResolvedValue([
    { id: 1, amount: 50.0, type: 'EXPENSE', transactionDate: '2026-11-10' }
  ])
}));

describe('Auth & Password Security Rendering', () => {
  it('deve renderizar tela de Register com campos de apelido, e-mail e checklist de senha forte', () => {
    render(
      <BrowserRouter>
        <Register />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Nome ou Apelido')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu E-mail')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha Forte')).toBeInTheDocument();
    expect(screen.getByText('Requisitos para uma senha forte:')).toBeInTheDocument();
    expect(screen.getByText('Pelo menos 8 caracteres')).toBeInTheDocument();
    expect(screen.getByText('Uma letra maiúscula (A-Z)')).toBeInTheDocument();
    expect(screen.getByText('Uma letra minúscula (a-z)')).toBeInTheDocument();
    expect(screen.getByText('Um número (0-9)')).toBeInTheDocument();
    expect(screen.getByText('Um caractere especial (@, $, !, etc.)')).toBeInTheDocument();
  });

  it('deve renderizar tela de Login com campo de e-mail ou usuário', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('E-mail ou Usuário')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
  });

  it('deve renderizar o banner "Termine de preencher seu perfil" na Home quando o usuário não possui e-mail', async () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(await screen.findByText('Termine de preencher seu perfil')).toBeInTheDocument();
  });

  it('deve renderizar o campo de e-mail na tela de Profile', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    expect(await screen.findByLabelText(/E-mail/i)).toBeInTheDocument();
  });
});
