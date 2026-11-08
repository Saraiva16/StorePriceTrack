import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminCuration from '../pages/AdminCuration';
import { ThemeProvider } from '../context/ThemeContext';
import * as AuthContext from '../components/Auth/AuthContext';

vi.mock('../components/Auth/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../components/NotificationBell/NotificationBell', () => ({
  default: () => <div data-testid="notification-bell" />
}));

describe('AdminCuration Rendering & Data Mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AuthContext.useAuth.mockReturnValue({
      user: { username: 'admin' }
    });
  });

  it('deve renderizar itens retornados em snake_case com frações decimais (ex: 0.354 kg) sem truncar para 0 ou exibir NaN', async () => {
    const mockReceipt = {
      id: 101,
      market_name: 'Supermercado Modelo',
      purchase_date: '2026-11-07T18:30:00',
      total_amount: 54.32,
      source_url: 'https://fazenda.sp.gov.br/nfce',
      items: [
        {
          original_name: 'PRES COZ SEARA FAT',
          normalized_name: 'PRESUNTO COZIDO FATIADO',
          brand: 'Seara',
          unit_measure: 'kg',
          quantity: 0.354,
          unit_price: 35.90,
          total_price: 12.71
        },
        {
          original_name: 'LEITE INTEGRAL AURORA 1L',
          normalized_name: 'LEITE INTEGRAL',
          brand: 'Aurora',
          unit_measure: 'un',
          quantity: 2,
          unit_price: 5.49,
          total_price: 10.98
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [mockReceipt]
      })
    });

    render(
      <ThemeProvider>
        <BrowserRouter>
          <AdminCuration />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Supermercado Modelo')).toBeInTheDocument();
      expect(screen.getByText('R$ 54,32')).toBeInTheDocument();
    });

    // O item com 0.354 kg deve exibir "0,354" (e não 0)
    expect(screen.getByText('0,354')).toBeInTheDocument();
    expect(screen.queryByText('R$ NaN')).not.toBeInTheDocument();
    expect(screen.getByText('R$ 12,71')).toBeInTheDocument();

    // Conferir nomes cru e normalizado
    expect(screen.getByText('PRES COZ SEARA FAT')).toBeInTheDocument();
    expect(screen.getByText('PRESUNTO COZIDO FATIADO')).toBeInTheDocument();
    expect(screen.getByText('Seara')).toBeInTheDocument();

    // Conferir item inteiro
    expect(screen.getByText('LEITE INTEGRAL AURORA 1L')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('R$ 10,98')).toBeInTheDocument();
  });

  it('deve permitir editar nome, marca e unidade de medida no modo de edição', async () => {
    const mockReceipt = {
      id: 102,
      market_name: 'Supermercado Teste',
      purchase_date: '2026-11-07T18:30:00',
      total_amount: 10.00,
      items: [
        {
          original_name: 'PROD TESTE',
          normalized_name: 'PRODUTO TESTE',
          brand: '',
          unit_measure: 'un',
          quantity: 1,
          unit_price: 10.00,
          total_price: 10.00
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [mockReceipt] })
    });

    render(
      <ThemeProvider>
        <BrowserRouter>
          <AdminCuration />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('PRODUTO TESTE')).toBeInTheDocument();
    });

    // Clica no botão de edição
    const editBtn = screen.getByText('Ajustar Nomes, Marca e Unidade');
    fireEvent.click(editBtn);

    // Inputs devem estar no documento
    const brandInput = screen.getByPlaceholderText('Marca (ex: Seara)');
    expect(brandInput).toBeInTheDocument();
    fireEvent.change(brandInput, { target: { value: 'Marca Nova' } });
    expect(brandInput.value).toBe('Marca Nova');

    const unitSelect = screen.getByRole('combobox');
    expect(unitSelect).toBeInTheDocument();
    fireEvent.change(unitSelect, { target: { value: 'kg' } });
    expect(unitSelect.value).toBe('kg');
  });

  it('deve renderizar o botão de alternância de tema e permitir alternar entre claro e escuro', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ content: [] })
    });

    render(
      <ThemeProvider>
        <BrowserRouter>
          <AdminCuration />
        </BrowserRouter>
      </ThemeProvider>
    );

    const themeBtn = screen.getByLabelText('Alternar tema');
    expect(themeBtn).toBeInTheDocument();

    // Clica para alternar tema
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
