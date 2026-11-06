import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, ExternalLink, RefreshCw, AlertCircle, ArrowLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthContext';
import './AdminCuration.css';

export default function AdminCuration() {
  const { user } = useAuth();
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

  const handleApprove = async (receipt) => {
    setProcessingId(receipt.id);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        marketName: receipt.marketName,
        totalAmount: receipt.totalAmount,
        items: receipt.items
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

  const handleItemNameChange = (receiptId, index, newNormalizedName) => {
    if (!editingReceipt || editingReceipt.id !== receiptId) return;
    const updatedItems = [...editingReceipt.items];
    updatedItems[index] = {
      ...updatedItems[index],
      normalizedName: newNormalizedName
    };
    setEditingReceipt({ ...editingReceipt, items: updatedItems });
  };

  return (
    <div className="curation-page-container">
      <header className="curation-header">
        <button className="back-btn" onClick={() => navigate('/home')}>
          <ArrowLeft size={20} />
        </button>
        <div className="curation-title-group">
          <h1>Curadoria de Notas Fiscais</h1>
          <p>Validação e higienização antes da entrada no catálogo mestre</p>
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

            return (
              <div key={receipt.id} className="curation-card">
                <div className="curation-card-top">
                  <div className="curation-market-info">
                    <h3>{currentReceipt.marketName || 'Supermercado'}</h3>
                    <span className="curation-date">
                      {currentReceipt.purchaseDate ? new Date(currentReceipt.purchaseDate).toLocaleString('pt-BR') : 'Data não informada'}
                    </span>
                  </div>
                  <div className="curation-total-badge">
                    R$ {Number(currentReceipt.totalAmount || 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>

                {receipt.sourceUrl && (
                  <div className="curation-link-row">
                    <a href={receipt.sourceUrl} target="_blank" rel="noopener noreferrer" className="fazenda-link">
                      <ExternalLink size={16} />
                      <span>Conferir Nota Original na Fazenda / SEFAZ</span>
                    </a>
                  </div>
                )}

                {/* Tabela de Itens com Normalização */}
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
                      {currentReceipt.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="raw-name-cell">{item.originalName}</td>
                          <td>
                            {isEditing ? (
                              <input 
                                type="text"
                                className="item-name-edit-input"
                                value={item.normalizedName || ''}
                                onChange={(e) => handleItemNameChange(receipt.id, idx, e.target.value)}
                              />
                            ) : (
                              <strong>{item.normalizedName || item.originalName}</strong>
                            )}
                          </td>
                          <td>{item.brand || '-'}</td>
                          <td><span className="badge-unit">{item.unitMeasure || 'un'}</span></td>
                          <td>{Number(item.quantity).toFixed(item.unitMeasure === 'kg' ? 3 : 0)}</td>
                          <td>R$ {Number(item.totalPrice).toFixed(2).replace('.', ',')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ações da Nota */}
                {activeTab === 'EM_ANALISE' && (
                  <div className="curation-actions-row">
                    {!isEditing ? (
                      <button 
                        className="btn-edit-curation"
                        onClick={() => setEditingReceipt(JSON.parse(JSON.stringify(receipt)))}
                      >
                        Ajustar Nomes
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
