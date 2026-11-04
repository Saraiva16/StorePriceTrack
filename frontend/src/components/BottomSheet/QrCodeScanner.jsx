import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';
import './QrCodeScanner.css';

export default function QrCodeScanner({ onScanSuccess }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'success'
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const codeReaderRef = useRef(null);
  const hasReportedSuccess = useRef(false);

  useEffect(() => {
    hasReportedSuccess.current = false;
    const codeReader = new BrowserQRCodeReader();
    codeReaderRef.current = codeReader;

    const startCamera = async () => {
      try {
        setIsStarting(true);
        setErrorMessage('');

        const constraints = {
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920, min: 1280 },
            height: { ideal: 1080, min: 720 }
          }
        };

        const controls = await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result, error) => {
            if (result && !hasReportedSuccess.current) {
              const text = result.getText();
              if (text && (text.startsWith('http') || text.includes('|') || text.includes('fazenda'))) {
                triggerSuccess(text, controls);
              }
            }
          }
        );

        controlsRef.current = controls;
      } catch (err) {
        console.error('Erro ao acessar câmera no ZXing:', err);
        setErrorMessage('Não foi possível iniciar a câmera. Verifique as permissões do navegador.');
      } finally {
        setIsStarting(false);
      }
    };

    startCamera();

    return () => {
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch (_) {}
      }
    };
  }, [onScanSuccess]);

  const triggerSuccess = (decodedText, controls) => {
    hasReportedSuccess.current = true;
    setScanStatus('success');

    if (navigator.vibrate) {
      try { navigator.vibrate(120); } catch (_) {}
    }

    setTimeout(() => {
      if (controls) {
        try { controls.stop(); } catch (_) {}
      }
      onScanSuccess(decodedText);
    }, 350);
  };

  // Botão de Snapshot manual: tira foto estática do frame de alta resolução e varre o QR Code
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || hasReportedSuccess.current || isCapturing) return;

    try {
      setIsCapturing(true);
      setErrorMessage('');

      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/png');
      const reader = codeReaderRef.current || new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(dataUrl);

      const text = result?.getText();
      if (text) {
        triggerSuccess(text, controlsRef.current);
      } else {
        setErrorMessage('QR Code não reconhecido nesta foto. Aproxime mais e mantenha o cupom firme.');
      }
    } catch (err) {
      console.warn('Falha na captura do snapshot:', err);
      setErrorMessage('Não conseguimos ler o QR Code nessa posição. Ajuste o foco ou iluminação e tente novamente.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="qr-scanner-wrapper">
      <div className="qr-viewfinder-container">
        <video 
          ref={videoRef} 
          className="qr-video-element" 
          autoPlay 
          playsInline 
          muted 
        />

        {/* Moldura guia sobreposta */}
        <div className={`qr-target-frame ${scanStatus === 'success' ? 'frame-success' : 'frame-searching'}`}>
          <div className="corner corner-top-left" />
          <div className="corner corner-top-right" />
          <div className="corner corner-bottom-left" />
          <div className="corner corner-bottom-right" />
          <div className="scanner-laser-line" />
        </div>

        {scanStatus === 'success' && (
          <div className="scan-success-badge animate-fade-in">
            ✓ QR Code Identificado!
          </div>
        )}
      </div>

      {/* Botão de disparo instantâneo (Snapshot) */}
      <button
        type="button"
        className="btn-capture-snapshot"
        onClick={handleCaptureSnapshot}
        disabled={isStarting || isCapturing || scanStatus === 'success'}
      >
        {isCapturing ? (
          <>
            <Loader2 size={20} className="spinner" />
            Analisando Foto...
          </>
        ) : (
          <>
            <Camera size={22} />
            Fotografar QR Code
          </>
        )}
      </button>

      {isStarting && (
        <p className="scanner-hint-text">
          Ajustando câmera... Aponte para o QR Code da nota.
        </p>
      )}

      {!isStarting && scanStatus !== 'success' && !errorMessage && (
        <p className="scanner-hint-text">
          Aponte para o QR Code para leitura automática ou toque em <strong>Fotografar QR Code</strong>.
        </p>
      )}

      {errorMessage && (
        <div className="scanner-error-message">
          <AlertCircle size={20} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
