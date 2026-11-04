import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import ImportReceipt from '../pages/ImportReceipt';
import ReceiptConfirmation from '../pages/ReceiptConfirmation';

// Mock do @zxing/browser
vi.mock('@zxing/browser', () => {
  return {
    BrowserQRCodeReader: class {
      decodeFromConstraints() {
        return Promise.resolve({
          stop: vi.fn()
        });
      }
      decodeFromImageUrl() {
        return Promise.resolve({
          getText: () => 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=123'
        });
      }
    }
  };
});

describe('ImportReceipt e ReceiptConfirmation Renderização', () => {
  it('deve renderizar a tela ImportReceipt com instrução de QR Code e modos de captura', () => {
    render(
      <BrowserRouter>
        <ImportReceipt />
      </BrowserRouter>
    );

    expect(screen.getByText('Adicionar Nota')).toBeInTheDocument();
    expect(screen.getByText('Fotografe o QR Code da Nota')).toBeInTheDocument();
    expect(screen.getByText('Escanear Câmera')).toBeInTheDocument();
    expect(screen.getByText('Foto do QR Code')).toBeInTheDocument();
    expect(screen.getByText('Colar Link')).toBeInTheDocument();
  });

  it('deve alternar para modo Foto do QR Code e exibir área de seleção', () => {
    render(
      <BrowserRouter>
        <ImportReceipt />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Foto do QR Code'));
    expect(screen.getByText('Toque para escolher a foto do QR Code')).toBeInTheDocument();
  });

  it('deve alternar para modo Colar Link e exibir input de URL da NFC-e', () => {
    render(
      <BrowserRouter>
        <ImportReceipt />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('Colar Link'));
    const input = screen.getByPlaceholderText(/https:\/\/www\.nfce\.fazenda\.sp\.gov\.br/i);
    expect(input).toBeInTheDocument();
    expect(screen.getByText('Importar via Link da NFC-e')).toBeInTheDocument();
  });

  it('deve renderizar a tela ReceiptConfirmation com os dados da nota oficial', () => {
    const mockReceipt = {
      id: 99,
      market_name: 'SUPERMERCADO MODELO LTDA',
      cnpj: '12.345.678/0001-99',
      purchase_date: '2026-11-03T18:00:00',
      total_amount: 45.80,
      access_key: '35261171779813001060650310000090491002655108',
      items: [
        {
          name: 'CAFÉ TORRADO 500G',
          quantity: 2,
          unit_price: 15.00,
          total_price: 30.00
        },
        {
          name: 'LEITE INTEGRAL 1L',
          quantity: 2,
          unit_price: 7.90,
          total_price: 15.80
        }
      ]
    };

    render(
      <MemoryRouter initialEntries={[{ pathname: '/receipt-confirmation', state: { receipt: mockReceipt } }]}>
        <ReceiptConfirmation />
      </MemoryRouter>
    );

    expect(screen.getByText('Conferência da Nota')).toBeInTheDocument();
    expect(screen.getByText('SUPERMERCADO MODELO LTDA')).toBeInTheDocument();
    expect(screen.getByText(/CNPJ: 12\.345\.678\/0001-99/)).toBeInTheDocument();
    expect(screen.getByText('Itens da Nota (2)')).toBeInTheDocument();
    expect(screen.getByText('CAFÉ TORRADO 500G')).toBeInTheDocument();
    expect(screen.getByText('LEITE INTEGRAL 1L')).toBeInTheDocument();
    expect(screen.getByText('R$ 45,80')).toBeInTheDocument();
    expect(screen.getByText('Confirmar e Concluir')).toBeInTheDocument();
  });

  it('deve exibir estado vazio em ReceiptConfirmation se nenhum recibo for passado', () => {
    render(
      <MemoryRouter initialEntries={['/receipt-confirmation']}>
        <ReceiptConfirmation />
      </MemoryRouter>
    );

    expect(screen.getByText('Conferir Nota')).toBeInTheDocument();
    expect(screen.getByText('Nenhuma nota encontrada para conferência.')).toBeInTheDocument();
  });
});
