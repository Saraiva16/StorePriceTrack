import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import Login from '../pages/Login';
import Profile from '../pages/Profile';
import Home from '../pages/Home';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

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
  changeUserPassword: vi.fn().mockResolvedValue({ message: 'OK' }),
  requestForgotPassword: vi.fn().mockResolvedValue({ message: 'OK' }),
  validateResetPasswordToken: vi.fn((token) => Promise.resolve(token === 'valid_token')),
  submitResetPassword: vi.fn().mockResolvedValue({ message: 'Senha redefinida com sucesso' })
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

  it('deve renderizar tela de Login com campo de e-mail ou usuário e link de esqueceu a senha', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('E-mail ou Usuário')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Senha')).toBeInTheDocument();
    expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument();
  });

  it('deve renderizar a tela de ForgotPassword corretamente', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Recuperar Senha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Seu e-mail cadastrado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enviar Link de Recuperação/i })).toBeInTheDocument();
    expect(screen.getByText('Voltar para o Login')).toBeInTheDocument();
  });

  it('deve renderizar a tela de ResetPassword com formulário quando token for válido', async () => {
    window.history.pushState({}, 'Reset Password', '/reset-password?token=valid_token');

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    expect(await screen.findByText('Criar Nova Senha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nova Senha')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Confirmar Nova Senha')).toBeInTheDocument();
    expect(screen.getByText('Requisitos para uma senha segura:')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Nova Senha/i })).toBeInTheDocument();
  });

  it('deve exibir aviso de link expirado/inválido em ResetPassword quando o token for inválido', async () => {
    window.history.pushState({}, 'Reset Password', '/reset-password?token=invalid_token');

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    expect(await screen.findByText('Link Expirado ou Inválido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solicitar Novo Link de Recuperação/i })).toBeInTheDocument();
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
