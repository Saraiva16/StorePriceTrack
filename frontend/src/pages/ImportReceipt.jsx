import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, UploadCloud, X, ChevronLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ImportReceipt.css';

export default function ImportReceipt() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedImage) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedImage);

      // Usando rota relativa, o proxy do Vite vai redirecionar para o localhost:8080
      const response = await fetch('/api/receipts/import', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Nota processada com sucesso!');
        handleClear();
        navigate('/home');
      } else {
        const errorData = await response.json().catch(() => null);
        const errMessage = errorData?.error || errorData?.message || '';
        
        if (response.status === 409 || errMessage.toLowerCase().includes('duplicat') || errMessage.toLowerCase().includes('já importado')) {
          alert('Atenção: Esta nota fiscal já foi fotografada e importada anteriormente!');
          handleClear();
        } else if (errMessage.includes('503') || errMessage.includes('indisponíveis')) {
          alert('A Inteligência Artificial do Google está com fila cheia no momento.\n\nSua foto foi salva em nossa fila! Assim que o sistema liberar (tentaremos novamente nas próximas horas), sua nota será processada automaticamente.\n\nVocê já pode continuar usando o aplicativo sem estresse!');
          handleClear();
          navigate('/home');
        } else {
          alert('Erro ao enviar nota: ' + (errMessage || 'Verifique se o backend está rodando.'));
        }
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      alert('Falha na conexão. O backend Spring Boot está ligado na porta 8080?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container animate-slide-up">
      <div className="header-bar">
        <button className="icon-btn" onClick={() => navigate('/home')} disabled={isLoading}>
          <ChevronLeft size={28} />
        </button>
        <h2>Adicionar Nota</h2>
        <div style={{ width: 28 }}></div>
      </div>

      <div className="import-content">
        {!previewUrl ? (
          <div className="upload-options">
            <div className="instruction-card">
              <div className="instruction-icon">🧾</div>
              <h3>Importe sua nota fiscal</h3>
              <p>Tire uma foto nítida do cupom inteiro ou escolha da galeria para que nossa inteligência artificial analise a compra.</p>
            </div>

            <div className="action-buttons">
              <button className="btn-primary" onClick={() => cameraInputRef.current?.click()}>
                <Camera size={24} />
                Tirar Foto
              </button>
              
              <button className="btn-secondary" onClick={() => galleryInputRef.current?.click()}>
                <ImageIcon size={24} />
                Escolher da Galeria
              </button>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-wrapper">
              <img src={previewUrl} alt="Preview da Nota" className="image-preview" style={{ opacity: isLoading ? 0.5 : 1 }} />
              {!isLoading && (
                <button className="clear-btn" onClick={handleClear}>
                  <X size={20} color="white" />
                </button>
              )}
            </div>
            
            <button className="btn-upload" onClick={handleUpload} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={24} className="spinner" />
                  Processando com IA...
                </>
              ) : (
                <>
                  <UploadCloud size={24} />
                  Enviar Nota para Análise
                </>
              )}
            </button>
          </div>
        )}

        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={cameraInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageChange}
        />
        <input 
          type="file" 
          accept="image/*" 
          ref={galleryInputRef} 
          style={{ display: 'none' }} 
          onChange={handleImageChange}
        />
      </div>
    </div>
  );
}
