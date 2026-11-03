import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';

export default function QrCodeScanner({ onScanSuccess, onClose }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef(null);
  const readerElementId = 'nfce-qr-reader';

  useEffect(() => {
    let html5QrCode = null;

    const startScanner = async () => {
      try {
        setIsStarting(true);
        setErrorMessage('');
        html5QrCode = new Html5Qrcode(readerElementId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          (decodedText) => {
            if (decodedText) {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
              }
              onScanSuccess(decodedText);
            }
          },
          () => {
            // Callback de frame sem detecção (ignorado para não poluir console)
          }
        );
      } catch (err) {
        console.error('Erro ao iniciar câmera para QR Code:', err);
        setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões do seu navegador.');
      } finally {
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        try {
          scannerRef.current.clear();
        } catch (_) {}
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '12px' }}>
      <div 
        id={readerElementId} 
        style={{ 
          width: '100%', 
          maxWidth: '320px', 
          minHeight: '260px', 
          borderRadius: '16px', 
          overflow: 'hidden',
          background: '#000',
          position: 'relative'
        }}
      />

      {isStarting && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Iniciando câmera... Aponte para o QR Code da nota fiscal.
        </p>
      )}

      {errorMessage && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4757', fontSize: '0.9rem', textAlign: 'center' }}>
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

