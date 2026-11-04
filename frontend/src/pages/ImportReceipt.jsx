import React, { useState, useRef } from 'react';
import { QrCode, Link as LinkIcon, ChevronLeft, Loader2, AlertCircle, Camera, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrowserQRCodeReader } from '@zxing/browser';
import QrCodeScanner from '../components/BottomSheet/QrCodeScanner';
import { importNfceUrl } from '../services/receiptsService';
import './ImportReceipt.css';

export default function ImportReceipt() {
  const [activeMode, setActiveMode] = useState('camera'); // 'camera' | 'file' | 'link'
  const [manualUrl, setManualUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleNfceSuccess = (receiptData) => {
    navigate('/receipt-confirmation', {
      state: { receipt: receiptData }
    });
  };

  const processNfceUrl = async (url) => {
    const cleanUrl = url?.trim();
    if (!cleanUrl) {
      setErrorMessage('URL da NFC-e inválida ou não encontrada.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const response = await importNfceUrl(cleanUrl);

      if (response.queued) {
        setInfoMessage(
          response.message || 
          'Nota fiscal recebida! O estado desta nota está sendo integrado ao sistema e em breve estará alocada.'
        );
        setTimeout(() => {
          navigate('/home');
        }, 4000);
      } else if (response.receipt) {
        handleNfceSuccess(response.receipt);
      } else {
        alert('Nota fiscal processada com sucesso!');
        navigate('/home');
      }
    } catch (err) {
      console.error('Erro ao processar URL da NFC-e:', err);
      const msg = err.message || 'Falha ao consultar nota fiscal na SEFAZ.';
      if (msg.toLowerCase().includes('já importado') || err.status === 409) {
        setErrorMessage('Atenção: Esta nota fiscal já foi importada anteriormente!');
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessing(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const imageUrl = URL.createObjectURL(file);
      const codeReader = new BrowserQRCodeReader();
      const result = await codeReader.decodeFromImageUrl(imageUrl);
      URL.revokeObjectURL(imageUrl);

      const text = result?.getText();
      if (text) {
        await processNfceUrl(text);
      } else {
        throw new Error('Nenhum QR Code detectado na foto');
      }
    } catch (err) {
      console.warn('Falha na decodificação do QR Code da foto:', err);
      setErrorMessage(
        'Não conseguimos identificar o QR Code na foto selecionada. Certifique-se de que a foto está bem nítida e focada no QR Code impresso no cupom.'
      );
      setIsProcessing(false);
    }
  };

  return (
    <div className="page-container animate-slide-up">
      <div className="header-bar">
        <button className="icon-btn" onClick={() => navigate('/home')} disabled={isProcessing}>
          <ChevronLeft size={28} />
        </button>
        <h2>Adicionar Nota</h2>
        <div style={{ width: 28 }} />
      </div>

      <div className="import-content">
        {/* Card explicativo orientando foco estrito no QR Code */}
        <div className="qr-instruction-banner">
          <div className="qr-instruction-badge">
            <QrCode size={26} color="var(--accent-color)" />
          </div>
          <div>
            <h3>Fotografe o QR Code da Nota</h3>
            <p>
              Não fotografe a nota inteira. Aponte sua câmera <strong>diretamente para o QR Code</strong> impresso no cupom para carregar os dados oficiais da Fazenda.
            </p>
          </div>
        </div>

        {/* Seletor de Modo: Câmera | Foto com QR Code | Colar Link */}
        <div className="mode-selector-tabs">
          <button
            type="button"
            className={`tab-btn ${activeMode === 'camera' ? 'tab-btn-active' : ''}`}
            onClick={() => { setActiveMode('camera'); setErrorMessage(''); }}
            disabled={isProcessing}
          >
            <Camera size={18} />
            Escanear Câmera
          </button>

          <button
            type="button"
            className={`tab-btn ${activeMode === 'file' ? 'tab-btn-active' : ''}`}
            onClick={() => { setActiveMode('file'); setErrorMessage(''); }}
            disabled={isProcessing}
          >
            <QrCode size={18} />
            Foto do QR Code
          </button>

          <button
            type="button"
            className={`tab-btn ${activeMode === 'link' ? 'tab-btn-active' : ''}`}
            onClick={() => { setActiveMode('link'); setErrorMessage(''); }}
            disabled={isProcessing}
          >
            <LinkIcon size={18} />
            Colar Link
          </button>
        </div>

        {/* Mensagens de Feedback */}
        {infoMessage && (
          <div className="feedback-banner feedback-info animate-fade-in">
            <CheckCircle size={20} />
            <span>{infoMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="feedback-banner feedback-error animate-fade-in">
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODO 1: CÂMERA AO VIVO COM ZXING HIGH RES */}
        {activeMode === 'camera' && (
          <div className="camera-scan-section">
            {!isProcessing ? (
              <QrCodeScanner
                onScanSuccess={(scannedUrl) => processNfceUrl(scannedUrl)}
              />
            ) : (
              <div className="processing-state-card">
                <Loader2 size={36} className="spinner" color="var(--accent-color)" />
                <h4>Consultando dados oficiais da SEFAZ...</h4>
                <p>Extraindo produtos, quantidades e valores da nota.</p>
              </div>
            )}
          </div>
        )}

        {/* MODO 2: FOTO DO QR CODE */}
        {activeMode === 'file' && (
          <div className="file-scan-section">
            <label className="file-drop-zone">
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              <QrCode size={48} color="var(--accent-color)" />
              <div className="drop-zone-text">
                <strong>{selectedFileName || 'Toque para escolher a foto do QR Code'}</strong>
                <span>Selecione a imagem contendo o QR Code do cupom fiscal</span>
              </div>
            </label>

            {isProcessing && (
              <div className="processing-state-inline">
                <Loader2 size={22} className="spinner" />
                <span>Localizando QR Code na foto e consultando SEFAZ...</span>
              </div>
            )}
          </div>
        )}

        {/* MODO 3: COLAR LINK MANUALMENTE */}
        {activeMode === 'link' && (
          <div className="manual-link-section">
            <p className="link-instructions">
              Cole o link completo da NFC-e retornado ao escanear a nota (ex: portal da Fazenda):
            </p>
            <input
              type="url"
              className="url-text-input"
              placeholder="https://www.nfce.fazenda.sp.gov.br/..."
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              disabled={isProcessing}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={!manualUrl.trim() || isProcessing}
              onClick={() => processNfceUrl(manualUrl)}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Consultando...
                </>
              ) : (
                'Importar via Link da NFC-e'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
