import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import './QrCodeScanner.css';

export default function QrCodeScanner({ onScanSuccess }) {
  const [errorMessage, setErrorMessage] = useState('');
  const [isStarting, setIsStarting] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scanStatus, setScanStatus] = useState('idle'); // 'idle' | 'captured' | 'success'
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState(null);
  
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const hasReportedSuccess = useRef(false);
  const isSnapshottingRef = useRef(false);
  const barcodeDetectorRef = useRef(null);
  const nativeDetectLoopId = useRef(null);

  const stopAllMediaTracks = () => {
    if (nativeDetectLoopId.current) {
      cancelAnimationFrame(nativeDetectLoopId.current);
      nativeDetectLoopId.current = null;
    }

    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (_) {}
      controlsRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject;
        if (stream.getTracks) {
          stream.getTracks().forEach(track => {
            try { track.stop(); } catch (_) {}
          });
        }
        videoRef.current.srcObject = null;
      } catch (_) {}
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          try { track.stop(); } catch (_) {}
        });
      } catch (_) {}
      streamRef.current = null;
    }
  };

  useEffect(() => {
    hasReportedSuccess.current = false;
    isSnapshottingRef.current = false;
    const codeReader = new BrowserQRCodeReader();
    codeReaderRef.current = codeReader;

    // Inicializa detector nativo de hardware se disponível no navegador
    if ('BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new window.BarcodeDetector({ formats: ['qr_code'] });
      } catch (e) {
        console.warn('BarcodeDetector nativo não pôde ser iniciado, usando fallback:', e);
      }
    }

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
            if (result && !hasReportedSuccess.current && !isSnapshottingRef.current) {
              const text = result.getText();
              if (isValidNfcePayload(text)) {
                triggerSuccess(text);
              }
            }
          }
        );

        controlsRef.current = controls;

        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject;
          streamRef.current = stream;

          // Aplica foco contínuo e zoom se a câmera do celular suportar
          const track = stream.getVideoTracks()?.[0];
          if (track && track.applyConstraints) {
            try {
              const capabilities = track.getCapabilities ? track.getCapabilities() : {};
              const advancedConstraints = {};

              if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
                advancedConstraints.focusMode = 'continuous';
              }
              if (capabilities.zoom && capabilities.zoom.max >= 1.5) {
                advancedConstraints.zoom = Math.min(1.5, capabilities.zoom.max);
              }

              if (Object.keys(advancedConstraints).length > 0) {
                await track.applyConstraints({ advanced: [advancedConstraints] });
              }
            } catch (e) {
              console.debug('Ajuste de foco/zoom contínuo não suportado pelo driver:', e);
            }
          }

          // Loop nativo de BarcodeDetector de altíssima performance em paralelo
          if (barcodeDetectorRef.current) {
            startNativeDetectionLoop();
          }
        }
      } catch (err) {
        console.error('Erro ao acessar câmera no ZXing:', err);
        setErrorMessage('Não foi possível iniciar a câmera. Verifique as permissões do navegador.');
      } finally {
        setIsStarting(false);
      }
    };

    startCamera();

    return () => {
      stopAllMediaTracks();
    };
  }, [onScanSuccess]);

  const isValidNfcePayload = (text) => {
    if (!text) return false;
    return text.startsWith('http') || text.includes('|') || text.includes('fazenda') || text.includes('sefaz');
  };

  const startNativeDetectionLoop = () => {
    const checkFrame = async () => {
      if (hasReportedSuccess.current || isSnapshottingRef.current || !videoRef.current || videoRef.current.readyState < 2) {
        nativeDetectLoopId.current = requestAnimationFrame(checkFrame);
        return;
      }

      try {
        if (barcodeDetectorRef.current) {
          const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
          if (barcodes && barcodes.length > 0 && !hasReportedSuccess.current && !isSnapshottingRef.current) {
            const rawVal = barcodes[0].rawValue;
            if (isValidNfcePayload(rawVal)) {
              triggerSuccess(rawVal);
              return;
            }
          }
        }
      } catch (_) {}

      nativeDetectLoopId.current = requestAnimationFrame(checkFrame);
    };

    nativeDetectLoopId.current = requestAnimationFrame(checkFrame);
  };

  const triggerSuccess = (decodedText) => {
    if (hasReportedSuccess.current) return;
    hasReportedSuccess.current = true;
    setScanStatus('success');

    stopAllMediaTracks();

    if (navigator.vibrate) {
      try { navigator.vibrate(120); } catch (_) {}
    }

    setTimeout(() => {
      onScanSuccess(decodedText);
    }, 300);
  };

  // Botão de Snapshot com congelamento da imagem e busca precisa
  const handleCaptureSnapshot = async () => {
    if (!videoRef.current || hasReportedSuccess.current || isCapturing) return;

    try {
      setIsCapturing(true);
      isSnapshottingRef.current = true;
      setErrorMessage('');

      const video = videoRef.current;

      // Pausa imediatamente a execução do stream de vídeo
      try {
        video.pause();
      } catch (_) {}

      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      // 1. Captura o frame RAW em alta resolução
      const canvasRaw = document.createElement('canvas');
      canvasRaw.width = width;
      canvasRaw.height = height;
      const ctxRaw = canvasRaw.getContext('2d');
      ctxRaw.drawImage(video, 0, 0, width, height);

      // Congela visualmente a imagem na tela para feedback
      const snapshotPreviewUrl = canvasRaw.toDataURL('image/jpeg', 0.92);
      setCapturedPreviewUrl(snapshotPreviewUrl);
      setScanStatus('captured');

      let detectedText = null;

      // Passada 1: BarcodeDetector nativo de hardware no frame original
      if (barcodeDetectorRef.current) {
        try {
          const barcodes = await barcodeDetectorRef.current.detect(canvasRaw);
          if (barcodes && barcodes.length > 0 && isValidNfcePayload(barcodes[0].rawValue)) {
            detectedText = barcodes[0].rawValue;
          }
        } catch (_) {}
      }

      // Passada 2: ZXing decodeFromCanvas no frame original
      if (!detectedText) {
        try {
          const reader = codeReaderRef.current || new BrowserQRCodeReader();
          const result = await reader.decodeFromCanvas(canvasRaw);
          if (result && isValidNfcePayload(result.getText())) {
            detectedText = result.getText();
          }
        } catch (_) {}
      }

      // Passada 3: Filtro de alto contraste / nitidez para cupons térmicos (tinta gasta)
      if (!detectedText) {
        try {
          const canvasEnhanced = document.createElement('canvas');
          canvasEnhanced.width = width;
          canvasEnhanced.height = height;
          const ctxEnhanced = canvasEnhanced.getContext('2d');
          ctxEnhanced.filter = 'grayscale(100%) contrast(180%) brightness(105%)';
          ctxEnhanced.drawImage(video, 0, 0, width, height);

          if (barcodeDetectorRef.current) {
            const barcodes = await barcodeDetectorRef.current.detect(canvasEnhanced);
            if (barcodes && barcodes.length > 0 && isValidNfcePayload(barcodes[0].rawValue)) {
              detectedText = barcodes[0].rawValue;
            }
          }

          if (!detectedText) {
            const reader = codeReaderRef.current || new BrowserQRCodeReader();
            const result = await reader.decodeFromCanvas(canvasEnhanced);
            if (result && isValidNfcePayload(result.getText())) {
              detectedText = result.getText();
            }
          }
        } catch (_) {}
      }

      if (detectedText) {
        triggerSuccess(detectedText);
      } else {
        setErrorMessage('QR Code não identificado nesta foto. Toque em "Tentar Novamente" e mantenha a câmera firme.');
      }
    } catch (err) {
      console.warn('Falha na captura do snapshot:', err);
      setErrorMessage('Não conseguimos ler o QR Code nesta foto. Tente novamente com mais iluminação.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetryCapture = () => {
    isSnapshottingRef.current = false;
    setCapturedPreviewUrl(null);
    setScanStatus('idle');
    setErrorMessage('');
    if (videoRef.current) {
      try {
        videoRef.current.play();
      } catch (_) {}
    }
  };

  return (
    <div className="qr-scanner-wrapper">
      <div className="qr-viewfinder-container">
        {/* Vídeo ao vivo */}
        <video 
          ref={videoRef} 
          className={`qr-video-element ${capturedPreviewUrl ? 'qr-video-hidden' : ''}`} 
          autoPlay 
          playsInline 
          muted 
        />

        {/* Imagem estática congelada após o clique em fotografar */}
        {capturedPreviewUrl && (
          <img 
            src={capturedPreviewUrl} 
            alt="Foto capturada do QR Code" 
            className="qr-captured-preview-img"
          />
        )}

        {/* Moldura guia sobreposta */}
        <div className={`qr-target-frame ${scanStatus === 'success' ? 'frame-success' : 'frame-searching'}`}>
          <div className="corner corner-top-left" />
          <div className="corner corner-top-right" />
          <div className="corner corner-bottom-left" />
          <div className="corner corner-bottom-right" />
          {scanStatus !== 'captured' && <div className="scanner-laser-line" />}
        </div>

        {scanStatus === 'success' && (
          <div className="scan-success-badge animate-fade-in">
            ✓ QR Code Identificado!
          </div>
        )}
      </div>

      {/* Ações da Câmera */}
      {scanStatus === 'captured' && !hasReportedSuccess.current ? (
        <button
          type="button"
          className="btn-capture-snapshot"
          onClick={handleRetryCapture}
          style={{ background: '#475569' }}
        >
          <RotateCcw size={20} />
          Tentar Novamente
        </button>
      ) : (
        <button
          type="button"
          className="btn-capture-snapshot"
          onClick={handleCaptureSnapshot}
          disabled={isStarting || isCapturing || scanStatus === 'success'}
        >
          {isCapturing ? (
            <>
              <Loader2 size={20} className="spinner" />
              Processando Foto...
            </>
          ) : (
            <>
              <Camera size={22} />
              Fotografar QR Code
            </>
          )}
        </button>
      )}

      {isStarting && (
        <p className="scanner-hint-text">
          Ajustando câmera... Aponte para o QR Code da nota.
        </p>
      )}

      {!isStarting && scanStatus === 'idle' && !errorMessage && (
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
