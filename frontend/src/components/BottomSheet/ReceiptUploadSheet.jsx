import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import './BottomSheet.css';

export default function ReceiptUploadSheet({
  isOpen,
  onClose,
  onUpload
}) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Por favor, selecione uma nota fiscal (PDF, JPG, PNG).');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onUpload(file);
      onClose(); // Close the sheet if successful
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
      <div className="bottom-sheet animate-slide-up-fast">
        <div className="bottom-sheet-header">
          <h3>Comprovar Compra</h3>
          <button className="close-btn" onClick={onClose} disabled={isProcessing}>
            <X size={24} />
          </button>
        </div>
        
        <div className="receipt-upload-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          
          <p style={{ textAlign: 'center', color: 'var(--text-dark)' }}>
            Envie a foto ou PDF da sua nota fiscal (NFe/NFCe) para validar sua compra e ver a comparação de preços.
          </p>

          <label 
            className="upload-area" 
            style={{ 
              border: '2px dashed var(--icon-color)', 
              borderRadius: '16px', 
              padding: '40px 20px', 
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
                <span style={{ fontWeight: 'bold' }}>Toque para selecionar a nota</span>
                <span style={{ fontSize: '0.8rem', color: '#666' }}>PDF, JPG ou PNG</span>
              </div>
            )}
          </label>

          {error && (
            <div style={{ color: '#ff4757', display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <button 
            className="btn-process-receipt"
            onClick={handleProcess}
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
              transition: 'all 0.3s',
              boxShadow: file && !isProcessing ? '0 4px 15px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            {isProcessing ? (
              <>
                <span className="spinner">↻</span>
                Processando IA...
              </>
            ) : (
              <>
                <CheckCircle size={24} />
                Processar Nota
              </>
            )}
          </button>
        </div>
      </div>
    </>,
    document.getElementById('root')
  );
}
