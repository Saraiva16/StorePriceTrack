import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle, Store, Calendar, ShieldCheck, Edit3, Loader2 } from 'lucide-react';
import { submitConfirmedReceipt } from '../services/receiptsService';
import './ReceiptConfirmation.css';

export default function ReceiptConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const preview = location.state?.preview;
  const legacyReceipt = location.state?.receipt;

  const data = preview || legacyReceipt;

  const initialItems = (data?.items || []).map(it => ({
    originalName: it.originalName || it.original_name || it.name || '',
    normalizedName: it.normalizedName || it.name || it.originalName || it.original_name || '',
    brand: it.brand || '',
    unitMeasure: it.unitMeasure || it.unit_measure || 'un',
    quantity: it.quantity ?? 1,
    unitPrice: it.unitPrice ?? it.unit_price ?? 0,
    totalPrice: it.totalPrice ?? it.total_price ?? ((it.quantity ?? 1) * (it.unitPrice ?? it.unit_price ?? 0)),
    category: it.category || 'Outros'
  }));

  const [items, setItems] = useState(initialItems);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!data) {
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

  const marketName = data.marketName || data.market_name || 'Estabelecimento Comercial';
  const totalAmount = data.totalAmount ?? data.total_amount ?? 0;
  const purchaseDate = data.purchaseDate || data.purchase_date;
  const accessKey = data.accessKey || data.access_key;
  const sourceUrl = data.sourceUrl || data.source_url;
  const cnpj = data.cnpj || data.marketCnpj || data.market_cnpj;

  const formattedDate = purchaseDate 
    ? new Date(purchaseDate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    : 'Data não informada';

  const handleItemNameChange = (index, newName) => {
    const updated = [...items];
    updated[index].normalizedName = newName;
    setItems(updated);
  };

  const handleConfirmAndSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (preview) {
        // Envia para a curadoria em análise com os nomes que o usuário conferiu/ajustou
        const payload = {
          sourceUrl,
          accessKey,
          marketName,
          marketCnpj: cnpj,
          purchaseDate: purchaseDate ? String(purchaseDate) : null,
          totalAmount,
          items
        };
        await submitConfirmedReceipt(payload);
        setSuccessMessage('Nota conferida e enviada com sucesso! Em instantes os dados estarão no sistema.');
        setTimeout(() => {
          navigate('/home');
        }, 3000);
      } else {
        navigate('/home');
      }
    } catch (e) {
      console.error(e);
      alert(e.message || 'Falha ao enviar conferência da nota.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        {successMessage && (
          <div className="curation-alert-info" style={{ margin: '16px 0', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '14px', borderRadius: '12px' }}>
            {successMessage}
          </div>
        )}

        <div className="confirmation-header-card">
          <div className="market-badge">
            <Store size={22} className="market-icon" />
            <div>
              <h3>{marketName}</h3>
              {cnpj && <span className="cnpj-text">CNPJ: {cnpj}</span>}
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
            <span className="helper-hint">Toque para corrigir algum nome abreviado se necessário</span>
          </div>

          <div className="items-scroll-list">
            {items.map((item, index) => {
              const isEditing = editingIndex === index;
              const displayName = item.normalizedName || item.originalName;

              return (
                <div key={index} className="confirmed-item-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="item-main-col" style={{ flex: 1, paddingRight: '10px' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input 
                            type="text" 
                            className="item-edit-input"
                            value={item.normalizedName}
                            onChange={(e) => handleItemNameChange(index, e.target.value)}
                            autoFocus
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #4361ee', width: '100%', fontSize: '14px' }}
                          />
                          <button 
                            type="button" 
                            onClick={() => setEditingIndex(null)}
                            style={{ background: '#4361ee', color: 'white', border: 'none', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Salvar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="item-title">{displayName}</span>
                          <button 
                            type="button" 
                            onClick={() => setEditingIndex(index)}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px' }}
                            title="Editar nome"
                          >
                            <Edit3 size={14} />
                          </button>
                        </div>
                      )}
                      
                      {item.originalName && item.originalName !== item.normalizedName && (
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                          Nota: {item.originalName}
                        </span>
                      )}

                      <span className="item-qty">
                        {item.quantity} {item.unitMeasure || 'un'} × R$ {Number(item.unitPrice).toFixed(2).replace('.', ',')}
                      </span>
                    </div>

                    <div className="item-total-col">
                      <strong>R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}</strong>
                    </div>
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
            onClick={handleConfirmAndSubmit}
            disabled={isSubmitting || Boolean(successMessage)}
          >
            {isSubmitting ? <Loader2 className="spinner" size={22} /> : <CheckCircle size={22} />}
            <span>{isSubmitting ? 'Enviando...' : 'Confirmar e Concluir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
