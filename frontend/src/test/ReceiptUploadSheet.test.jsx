import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReceiptUploadSheet from '../components/BottomSheet/ReceiptUploadSheet';

// Mock da biblioteca html5-qrcode para testes de renderização
vi.mock('html5-qrcode', () => {
  return {
    Html5Qrcode: class {
      constructor() {
        this.isScanning = false;
      }
      start() {
        return Promise.resolve(true);
      }
      stop() {
        return Promise.resolve(true);
      }
      clear() {}
    }
  };
});

describe('ReceiptUploadSheet Component', () => {
  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(
      <ReceiptUploadSheet isOpen={false} onClose={() => {}} onUpload={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar abas de Escanear QR, Colar Link e Arquivo/Foto quando isOpen for true', () => {
    render(
      <ReceiptUploadSheet isOpen={true} onClose={() => {}} onUpload={() => {}} />
    );

    expect(screen.getByText('Comprovar Compra')).toBeInTheDocument();
    expect(screen.getByText('Escanear QR')).toBeInTheDocument();
    expect(screen.getByText('Colar Link')).toBeInTheDocument();
    expect(screen.getByText('Arquivo/Foto')).toBeInTheDocument();
  });

  it('deve alternar para a aba Colar Link e permitir preencher a URL da NFC-e', () => {
    render(
      <ReceiptUploadSheet isOpen={true} onClose={() => {}} onUpload={() => {}} />
    );

    const linkTabButton = screen.getByText('Colar Link');
    fireEvent.click(linkTabButton);

    const input = screen.getByPlaceholderText(/https:\/\/www\.nfce\.fazenda\.sp\.gov\.br/i);
    expect(input).toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=123' } });
    expect(input.value).toBe('https://www.nfce.fazenda.sp.gov.br/NFCeConsultaPublica/Paginas/ConsultaQRCode.aspx?p=123');

    const submitBtn = screen.getByText('Importar via Link da NFC-e');
    expect(submitBtn).toBeEnabled();
  });

  it('deve alternar para a aba Arquivo/Foto e exibir a área de upload', () => {
    render(
      <ReceiptUploadSheet isOpen={true} onClose={() => {}} onUpload={() => {}} />
    );

    const fileTabButton = screen.getByText('Arquivo/Foto');
    fireEvent.click(fileTabButton);

    expect(screen.getByText('Selecionar arquivo da nota')).toBeInTheDocument();
    expect(screen.getByText('Processar Nota')).toBeInTheDocument();
  });
});
