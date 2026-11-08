import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell/NotificationBell';
import * as notifService from '../services/notificationService';

vi.mock('../services/notificationService', () => ({
  getNotifications: vi.fn(),
  getUnreadCount: vi.fn(),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  subscribeToWebPush: vi.fn(),
  sendTestPush: vi.fn()
}));

describe('NotificationBell Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifService.getUnreadCount.mockResolvedValue(3);
    notifService.getNotifications.mockResolvedValue({
      content: [
        {
          id: 1,
          title: 'Nova Nota Fiscal Recebida',
          message: 'Nota de WMS Supermercados (R$ 150,00) pendente de curadoria.',
          type: 'RECEIPT_CURATION_PENDING',
          referenceId: 10,
          read: false,
          createdAt: '2026-11-07T18:00:00'
        }
      ]
    });
  });

  it('deve montar e renderizar o sino com badge de não lidas sem erros', async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const triggerBtn = screen.getByRole('button', { name: /abrir notificações/i });
    expect(triggerBtn).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  it('deve abrir o dropdown ao clicar e exibir os avisos e botões de push', async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const triggerBtn = screen.getByRole('button', { name: /abrir notificações/i });
    fireEvent.click(triggerBtn);

    await waitFor(() => {
      expect(screen.getByText('Notificações')).toBeInTheDocument();
      expect(screen.getByText('Nova Nota Fiscal Recebida')).toBeInTheDocument();
      expect(screen.getByText(/WMS Supermercados/i)).toBeInTheDocument();
    });
  });
});
