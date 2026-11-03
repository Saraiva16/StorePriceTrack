import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, CheckCircle, AlertCircle, QrCode, Link as LinkIcon, Camera } from 'lucide-react';
import QrCodeScanner from './QrCodeScanner';
import { importNfceUrl } from '../../services/receiptsService';
import './BottomSheet.css';

export default function ReceiptUploadSheet({
  isOpen,
  onClose,
  onUpload
}) {
  const [activeTab, setActiveTab] = useState('qrcode'); // 'qrcode' | 'url' | 'file'
  const [file, setFile] = useState(null);
  const [nfceUrlInput, setNfceUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
      setInfoMessage('');
    }
  };

  const handleNfceUrlSubmit = async (urlToSubmit) => {
    const targetUrl = (urlToSubmit || nfceUrlInput).trim();
    if (!targetUrl) {
      setError('Por favor, informe a URL da NFC-e.');
      return;
    }

    setIsProcessing(true);
    setError('');
    setInfoMessage('');

    try {
      const response = await importNfceUrl(targetUrl);
      if (response.queued) {
        setInfoMessage(response.message || 'Nota recebida! O suporte a este estado está sendo integrado.');
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        // Se houver callback de upload ou refresh, chama
        if (onUpload) {
          await onUpload(null, response.receipt);
        }
        onClose();
      }
    } catch (err) {
      console.error('Falha ao importar URL NFC-e:', err);
      const errMsg = err.message || 'Erro ao consultar nota fiscal na SEFAZ.';
      if (errMsg.toLowerCase().includes('já importado') || err.status === 409) {
        setError('Atenção: Esta nota fiscal já foi importada anteriormente!');
      } else {
        setError(errMsg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError('Por favor, selecione uma nota fiscal (PDF, JPG, PNG).');
      return;
    }

    setIsProcessing(true);
    setError('');
    setInfoMessage('');

    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError('Falha ao processar a nota fiscal. Tente novamente.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <>
      <div className="bottom-sheet-overlay" onClick={isProcessing ? undefined : onClose}></div>
      <div className="bottom-sheet animate-slide-up-fast" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="bottom-sheet-header">
          <h3>Comprovar Compra</h3>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs de navegação */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', margin: '0 20px', gap: '8px' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('qrcode'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'qrcode' ? '3px solid var(--accent-color)' : '3px solid transparent',
              fontWeight: activeTab === 'qrcode' ? 'bold' : 'normal',
              color: activeTab === 'qrcode' ? 'var(--accent-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Camera size={18} />
            Escanear QR
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('url'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'url' ? '3px solid var(--accent-color)' : '3px solid transparent',
              fontWeight: activeTab === 'url' ? 'bold' : 'normal',
              color: activeTab === 'url' ? 'var(--accent-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <LinkIcon size={18} />
            Colar Link
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('file'); setError(''); }}
            style={{
              flex: 1,
              padding: '12px 6px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'file' ? '3px solid var(--accent-color)' : '3px solid transparent',
              fontWeight: activeTab === 'file' ? 'bold' : 'normal',
              color: activeTab === 'file' ? 'var(--accent-color)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '0.85rem'
            }}
          >
            <Upload size={18} />
            Arquivo/Foto
          </button>
        </div>
        
        <div className="receipt-upload-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
          
          {infoMessage && (
            <div style={{ background: '#2ed57322', color: '#2ed573', padding: '12px', borderRadius: '12px', width: '100%', fontSize: '0.9rem', textAlign: 'center' }}>
              ✓ {infoMessage}
            </div>
          )}

          {error && (
            <div style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', width: '100%', background: '#ff475715', padding: '10px 14px', borderRadius: '10px' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}

          {activeTab === 'qrcode' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-dark)', fontSize: '0.9rem', margin: 0 }}>
                Aponte a câmera para o <strong>QR Code</strong> impresso na sua nota fiscal para importar direto da Fazenda.
              </p>
              
              {!isProcessing ? (
                <QrCodeScanner
                  onScanSuccess={(scannedUrl) => {
                    handleNfceUrlSubmit(scannedUrl);
                  }}
                  onClose={onClose}
                />
              ) : (
                <div style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div className="spinner" style={{ fontSize: '2rem', marginBottom: '10px' }}>↻</div>
                  <p>Buscando nota diretamente no portal da SEFAZ...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ color: 'var(--text-dark)', fontSize: '0.9rem', margin: 0 }}>
                Copie e cole aqui o link completo da consulta da NFC-e gerado pelo QR Code:
              </p>
              <input
                type="url"
                placeholder="https://www.nfce.fazenda.sp.gov.br/..."
                value={nfceUrlInput}
                onChange={(e) => setNfceUrlInput(e.target.value)}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--card-secondary-bg)',
                  color: 'var(--text-dark)',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="button"
                onClick={() => handleNfceUrlSubmit()}
                disabled={!nfceUrlInput.trim() || isProcessing}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '50px',
                  background: nfceUrlInput.trim() ? 'var(--card-primary-bg)' : '#ccc',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: nfceUrlInput.trim() && !isProcessing ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isProcessing ? 'Consultando Fazenda...' : 'Importar via Link da NFC-e'}
              </button>
            </div>
          )}

          {activeTab === 'file' && (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-dark)', fontSize: '0.9rem', margin: 0 }}>
                Envie o cupom fiscal impresso para análise de fallback.
              </p>

              <label 
                className="upload-area" 
                style={{ 
                  border: '2px dashed var(--icon-color)', 
                  borderRadius: '16px', 
                  padding: '30px 20px', 
                  width: '100%', 
                  textAlign: 'center', 
                  cursor: 'pointer',
                  background: 'var(--card-secondary-bg)',
                  transition: 'background 0.3s'
                }}
              >
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileChange}
                  disabled={isProcessing}
                />
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <FileText size={48} color="var(--accent-color)" />
                    <span style={{ fontWeight: 'bold' }}>{file.name}</span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>Clique para alterar</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Upload size={48} color="var(--icon-color)" />
                    <span style={{ fontWeight: 'bold' }}>Selecionar arquivo da nota</span>
                    <span style={{ fontSize: '0.8rem', color: '#666' }}>PDF, JPG ou PNG</span>
                  </div>
                )}
              </label>

              <button 
                className="btn-process-receipt"
                onClick={handleProcessFile}
                disabled={!file || isProcessing}
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  borderRadius: '50px', 
                  background: file ? 'var(--card-primary-bg)' : '#ccc', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  fontSize: '16px',
                  display: 'flex', 
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: file && !isProcessing ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s'
                }}
              >
                {isProcessing ? (
                  <>
                    <span className="spinner">↻</span>
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={24} />
                    Processar Nota
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </>,
    document.getElementById('root') || document.body
  );
}
