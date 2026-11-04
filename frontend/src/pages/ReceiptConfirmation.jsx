import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Store, Calendar, ShieldCheck } from 'lucide-react';
import './ReceiptConfirmation.css';

export default function ReceiptConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const receipt = location.state?.receipt;

  if (!receipt) {
    return (
      <div className="page-container animate-slide-up">
        <div className="header-bar">
          <button className="icon-btn" onClick={() => navigate('/home')}>
            <ChevronLeft size={28} />
          </button>
          <h2>Conferir Nota</h2>
          <div style={{ width: 28 }} />
        </div>
        <div className="empty-confirmation-card">
          <p>Nenhuma nota encontrada para conferência.</p>
          <button className="btn-primary" onClick={() => navigate('/import')}>
            Escanear Nota
          </button>
        </div>
      </div>
    );
  }

  const items = receipt.items || [];
  const marketName = receipt.market_name || receipt.marketName || 'Estabelecimento Comercial';
  const totalAmount = receipt.total_amount ?? receipt.totalAmount ?? 0;
  const purchaseDate = receipt.purchase_date || receipt.purchaseDate;
  const accessKey = receipt.access_key || receipt.accessKey;

  const formattedDate = purchaseDate 
    ? new Date(purchaseDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Data não informada';

  return (
    <div className="page-container animate-slide-up">
      <div className="header-bar">
        <button className="icon-btn" onClick={() => navigate('/home')}>
          <ChevronLeft size={28} />
        </button>
        <h2>Conferência da Nota</h2>
        <div style={{ width: 28 }} />
      </div>

      <div className="receipt-confirmation-content">
        <div className="confirmation-header-card">
          <div className="market-badge">
            <Store size={22} className="market-icon" />
            <div>
              <h3>{marketName}</h3>
              {receipt.cnpj && <span className="cnpj-text">CNPJ: {receipt.cnpj}</span>}
            </div>
          </div>

          <div className="meta-info-row">
            <div className="meta-item">
              <Calendar size={16} />
              <span>{formattedDate}</span>
            </div>
            {accessKey && (
              <div className="meta-item">
                <ShieldCheck size={16} />
                <span>NFC-e Oficial</span>
              </div>
            )}
          </div>
        </div>

        <div className="items-list-section">
          <div className="items-list-header">
            <h4>Itens da Nota ({items.length})</h4>
            <span className="helper-hint">Confira os valores com o cupom em mãos</span>
          </div>

          <div className="items-scroll-list">
            {items.map((item, index) => {
              const itemName = item.original_name || item.originalName || item.name || 'Produto sem nome';
              const qty = item.quantity ?? 1;
              const unitPrice = item.unit_price ?? item.unitPrice ?? 0;
              const totalPrice = item.total_price ?? item.totalPrice ?? (qty * unitPrice);

              return (
                <div key={index} className="confirmed-item-row">
                  <div className="item-main-col">
                    <span className="item-title">{itemName}</span>
                    <span className="item-qty">
                      {qty} {qty > 1 ? 'unidades' : 'unidade'} × R$ {Number(unitPrice).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="item-total-col">
                    <strong>R$ {Number(totalPrice).toFixed(2).replace('.', ',')}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="confirmation-footer-card">
          <div className="total-summary-row">
            <span>Total da Compra</span>
            <span className="total-value">
              R$ {Number(totalAmount).toFixed(2).replace('.', ',')}
            </span>
          </div>

          <button 
            className="btn-primary btn-confirm-action" 
            onClick={() => navigate('/home')}
          >
            <CheckCircle size={22} />
            Confirmar e Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
