import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TripList from '../pages/TripList';
import Profile from '../pages/Profile';

// Mock do AuthContext
vi.mock('../components/Auth/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 5, username: 'Mateus Saraiva Silva', pixKey: '123' },
    logout: vi.fn(),
    updatePixKey: vi.fn()
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

describe('Validação de Renderização de Telas Frontend', () => {
  it('deve renderizar a tela TripList sem erros de runtime', async () => {
    const { findByText } = render(
      <BrowserRouter>
        <TripList />
      </BrowserRouter>
    );

    // Aguarda e valida os elementos essenciais renderizados
    expect(await findByText('Viagens e Eventos')).toBeInTheDocument();
    expect(await findByText('Mostrar viagens já concluídas')).toBeInTheDocument();
  });

  it('deve renderizar a tela Profile sem erros de runtime', async () => {
    const { findByText } = render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    // Aguarda e valida os elementos do perfil
    expect(await findByText('Meu Perfil')).toBeInTheDocument();
    expect(await findByText('Dados Cadastrais')).toBeInTheDocument();
    expect(await findByText('Segurança e Senha')).toBeInTheDocument();
  });
});
