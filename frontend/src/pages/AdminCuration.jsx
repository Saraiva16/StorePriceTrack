import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, ExternalLink, RefreshCw, AlertCircle, ArrowLeft, Layers, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../components/NotificationBell/NotificationBell';
import './AdminCuration.css';

export default function AdminCuration() {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [curationList, setCurationList] = useState([]);
  const [activeTab, setActiveTab] = useState('EM_ANALISE'); // 'EM_ANALISE' | 'APROVADA' | 'ATIVA' | 'REJEITADA'
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [batchPublishing, setBatchPublishing] = useState(false);
  const [message, setMessage] = useState('');
  const [editingReceipt, setEditingReceipt] = useState(null);

  useEffect(() => {
    if (user && user.username !== 'admin') {
      alert('Acesso restrito apenas para o administrador.');
      navigate('/home');
      return;
    }
    loadCurationData();
  }, [activeTab]);

  const loadCurationData = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/receipt-curation?status=${activeTab}&size=50`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCurationList(data.content || []);
      } else {
        setMessage('Erro ao carregar notas em curadoria.');
      }
    } catch (e) {
      console.error(e);
      setMessage('Falha na conexão ao carregar curadoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatQuantity = (quantity, unit) => {
    const num = Number(quantity);
    if (isNaN(num)) return '1';
    const u = (unit || '').toLowerCase();
    if (u === 'kg' || num % 1 !== 0) {
      return num.toLocaleString('pt-BR', { minimumFractionDigits: num % 1 !== 0 ? 2 : 0, maximumFractionDigits: 3 });
    }
    return num.toString();
  };

  const formatItemTotal = (item) => {
    const tp = item.totalPrice ?? item.total_price;
    if (tp != null && !isNaN(Number(tp))) {
      return Number(tp).toFixed(2).replace('.', ',');
    }
    const up = item.unitPrice ?? item.unit_price;
    const q = item.quantity ?? 1;
    if (up != null && !isNaN(Number(up))) {
      return (Number(q) * Number(up)).toFixed(2).replace('.', ',');
    }
    return '0,00';
  };

  const formatReceiptTotal = (receipt) => {
    const total = receipt.totalAmount ?? receipt.total_amount;
    if (total != null && !isNaN(Number(total))) {
      return Number(total).toFixed(2).replace('.', ',');
    }
    return '0,00';
  };

  const handleApprove = async (receipt) => {
    setProcessingId(receipt.id);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        marketName: receipt.marketName || receipt.market_name,
        market_name: receipt.marketName || receipt.market_name,
        totalAmount: receipt.totalAmount ?? receipt.total_amount,
        total_amount: receipt.totalAmount ?? receipt.total_amount,
        items: (receipt.items || []).map(it => ({
          originalName: it.originalName || it.original_name,
          original_name: it.originalName || it.original_name,
          normalizedName: it.normalizedName || it.normalized_name,
          normalized_name: it.normalizedName || it.normalized_name,
          brand: it.brand || '',
          unitMeasure: it.unitMeasure || it.unit_measure || 'un',
          unit_measure: it.unitMeasure || it.unit_measure || 'un',
          quantity: it.quantity ?? 1,
          unitPrice: it.unitPrice ?? it.unit_price ?? 0,
          unit_price: it.unitPrice ?? it.unit_price ?? 0,
          totalPrice: it.totalPrice ?? it.total_price ?? 0,
          total_price: it.totalPrice ?? it.total_price ?? 0,
          category: it.category || 'Outros'
        }))
      };
      const res = await fetch(`/api/admin/receipt-curation/${receipt.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setCurationList(prev => prev.filter(r => r.id !== receipt.id));
        setEditingReceipt(null);
        setMessage(`Nota ID #${receipt.id} marcada como APROVADA com sucesso!`);
      } else {
        alert('Erro ao aprovar nota.');
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao processar aprovação.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Tem certeza que deseja rejeitar esta nota?')) return;
    setProcessingId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/receipt-curation/${id}/reject`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setCurationList(prev => prev.filter(r => r.id !== id));
        setMessage(`Nota ID #${id} rejeitada.`);
      } else {
        alert('Erro ao rejeitar nota.');
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao processar rejeição.');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublishBatch = async () => {
    if (!window.confirm('Deseja ativar todas as notas aprovadas no sistema e no catálogo de produtos oficial?')) return;
    setBatchPublishing(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/receipt-curation/publish-batch', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`${data.publishedCount} notas foram consolidadas com sucesso no sistema!`);
        loadCurationData();
      } else {
        alert('Erro ao publicar lote de notas aprovadas.');
      }
    } catch (e) {
      console.error(e);
      alert('Falha ao publicar lote.');
    } finally {
      setBatchPublishing(false);
    }
  };

  const handleItemFieldChange = (receiptId, index, field, value) => {
    if (!editingReceipt || editingReceipt.id !== receiptId) return;
    const updatedItems = [...editingReceipt.items];
    const targetItem = { ...updatedItems[index] };

    if (field === 'normalizedName') {
      targetItem.normalizedName = value;
      targetItem.normalized_name = value;
    } else if (field === 'brand') {
      targetItem.brand = value;
    } else if (field === 'unitMeasure') {
      targetItem.unitMeasure = value;
      targetItem.unit_measure = value;
    }

    updatedItems[index] = targetItem;
    setEditingReceipt({ ...editingReceipt, items: updatedItems });
  };

  const handleStartEditing = (receipt) => {
    const cloned = JSON.parse(JSON.stringify(receipt));
    cloned.items = (cloned.items || []).map(it => ({
      ...it,
      originalName: it.originalName || it.original_name || '',
      original_name: it.originalName || it.original_name || '',
      normalizedName: it.normalizedName || it.normalized_name || it.originalName || it.original_name || '',
      normalized_name: it.normalizedName || it.normalized_name || it.originalName || it.original_name || '',
      brand: it.brand || '',
      unitMeasure: (it.unitMeasure || it.unit_measure || 'un').toLowerCase(),
      unit_measure: (it.unitMeasure || it.unit_measure || 'un').toLowerCase()
    }));
    setEditingReceipt(cloned);
  };

  return (
    <div className="curation-page-container">
      <header className="curation-header">
        <div className="curation-header-left">
          <button className="back-btn" onClick={() => navigate('/home')} title="Voltar para Home">
            <ArrowLeft size={22} />
          </button>
          <div className="curation-title-group">
            <h1>Curadoria de Notas Fiscais</h1>
            <p>Validação e higienização antes da entrada no catálogo mestre</p>
          </div>
        </div>
        <div className="curation-header-right">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            aria-label="Alternar tema"
          >
            {isDark ? <Sun size={20} color="#fbbf24" /> : <Moon size={20} />}
          </button>
          <NotificationBell />
        </div>
      </header>

      {/* Tabs de Status */}
      <div className="curation-tabs">
        <button 
          className={`tab-btn ${activeTab === 'EM_ANALISE' ? 'active' : ''}`}
          onClick={() => { setActiveTab('EM_ANALISE'); setEditingReceipt(null); }}
        >
          Em Análise
        </button>
        <button 
          className={`tab-btn ${activeTab === 'APROVADA' ? 'active' : ''}`}
          onClick={() => { setActiveTab('APROVADA'); setEditingReceipt(null); }}
        >
          Aprovadas (Prontas para Ativar)
        </button>
        <button 
          className={`tab-btn ${activeTab === 'ATIVA' ? 'active' : ''}`}
          onClick={() => { setActiveTab('ATIVA'); setEditingReceipt(null); }}
        >
          Ativas no Sistema
        </button>
        <button 
          className={`tab-btn ${activeTab === 'REJEITADA' ? 'active' : ''}`}
          onClick={() => { setActiveTab('REJEITADA'); setEditingReceipt(null); }}
        >
          Rejeitadas
        </button>
      </div>

      {activeTab === 'APROVADA' && curationList.length > 0 && (
        <div className="curation-batch-bar">
          <span>Você tem <strong>{curationList.length}</strong> notas prontas para consolidação.</span>
          <button 
            className="btn-publish-batch" 
            onClick={handlePublishBatch}
            disabled={batchPublishing}
          >
            <Layers size={18} />
            {batchPublishing ? 'Publicando...' : 'Publicar Todas em Lote no Sistema'}
          </button>
        </div>
      )}

      {message && <div className="curation-alert-info">{message}</div>}

      {isLoading ? (
        <div className="curation-loading">
          <RefreshCw className="spinner" size={32} />
          <p>Carregando notas...</p>
        </div>
      ) : curationList.length === 0 ? (
        <div className="curation-empty">
          <CheckCircle2 size={48} color="#2ed573" />
          <p>Nenhuma nota com status <strong>{activeTab}</strong> no momento!</p>
        </div>
      ) : (
        <div className="curation-cards-list">
          {curationList.map(receipt => {
            const isEditing = editingReceipt?.id === receipt.id;
            const currentReceipt = isEditing ? editingReceipt : receipt;
            const marketName = currentReceipt.marketName || currentReceipt.market_name || 'Supermercado';
            const purchaseDate = currentReceipt.purchaseDate || currentReceipt.purchase_date;
            const sourceUrl = currentReceipt.sourceUrl || currentReceipt.source_url;

            return (
              <div key={receipt.id} className="curation-card">
                <div className="curation-card-top">
                  <div className="curation-market-info">
                    <h3>{marketName}</h3>
                    <span className="curation-date">
                      {purchaseDate ? new Date(purchaseDate).toLocaleString('pt-BR') : 'Data não informada'}
                    </span>
                  </div>
                  <div className="curation-total-badge">
                    R$ {formatReceiptTotal(currentReceipt)}
                  </div>
                </div>

                {sourceUrl && (
                  <div className="curation-link-row">
                    <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="fazenda-link">
                      <ExternalLink size={16} />
                      <span>Conferir Nota Original na Fazenda / SEFAZ</span>
                    </a>
                  </div>
                )}

                {/* Tabela de Itens com Normalização Expandida */}
                <div className="curation-items-table-wrapper">
                  <table className="curation-items-table">
                    <thead>
                      <tr>
                        <th>Nome na Nota (Cru)</th>
                        <th>Nome Normalizado / Catálogo</th>
                        <th>Marca</th>
                        <th>Unidade</th>
                        <th>Qtd</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReceipt.items?.map((item, idx) => {
                        const origName = item.originalName || item.original_name || '-';
                        const normName = item.normalizedName || item.normalized_name || origName;
                        const brand = item.brand || '';
                        const unit = (item.unitMeasure || item.unit_measure || 'un').toLowerCase();

                        return (
                          <tr key={idx}>
                            <td className="raw-name-cell">{origName}</td>
                            <td>
                              {isEditing ? (
                                <input 
                                  type="text"
                                  className="item-name-edit-input"
                                  value={item.normalizedName || item.normalized_name || ''}
                                  placeholder="Nome padronizado do produto"
                                  onChange={(e) => handleItemFieldChange(receipt.id, idx, 'normalizedName', e.target.value)}
                                />
                              ) : (
                                <strong>{normName}</strong>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <input 
                                  type="text"
                                  className="item-brand-edit-input"
                                  value={brand}
                                  placeholder="Marca (ex: Seara)"
                                  onChange={(e) => handleItemFieldChange(receipt.id, idx, 'brand', e.target.value)}
                                />
                              ) : (
                                <span>{brand || '-'}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  className="item-unit-edit-select"
                                  value={unit}
                                  onChange={(e) => handleItemFieldChange(receipt.id, idx, 'unitMeasure', e.target.value)}
                                >
                                  <option value="un">UN</option>
                                  <option value="kg">KG</option>
                                  <option value="g">G</option>
                                  <option value="l">L</option>
                                  <option value="ml">ML</option>
                                  <option value="cx">CX</option>
                                  <option value="pct">PCT</option>
                                  <option value="dz">DZ</option>
                                </select>
                              ) : (
                                <span className="badge-unit">{unit}</span>
                              )}
                            </td>
                            <td>{formatQuantity(item.quantity, unit)}</td>
                            <td>R$ {formatItemTotal(item)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Ações da Nota */}
                {activeTab === 'EM_ANALISE' && (
                  <div className="curation-actions-row">
                    {!isEditing ? (
                      <button 
                        className="btn-edit-curation"
                        onClick={() => handleStartEditing(receipt)}
                      >
                        Ajustar Nomes, Marca e Unidade
                      </button>
                    ) : (
                      <button 
                        className="btn-cancel-edit"
                        onClick={() => setEditingReceipt(null)}
                      >
                        Cancelar Edição
                      </button>
                    )}

                    <button 
                      className="btn-reject-curation"
                      onClick={() => handleReject(receipt.id)}
                      disabled={processingId === receipt.id}
                    >
                      <XCircle size={18} />
                      Rejeitar
                    </button>

                    <button 
                      className="btn-approve-curation"
                      onClick={() => handleApprove(currentReceipt)}
                      disabled={processingId === receipt.id}
                    >
                      <CheckCircle2 size={18} />
                      {processingId === receipt.id ? 'Salvando...' : 'Aprovar Nota'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
