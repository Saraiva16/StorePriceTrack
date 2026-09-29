import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import './PostEventWizard.css';

export default function PostEventWizard({ onClose, eventData, estimates }) {
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState({
    sobras: '',
    faltas: '',
    notaFiscal: null
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const handleFinish = () => {
    // Aqui enviaríamos os dados para o backend treinar o algoritmo
    console.log('Feedback salvo para ML:', feedback);
    onClose();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFeedback(prev => ({ ...prev, notaFiscal: file }));
    }
  };

  return (
    <div className="wizard-overlay animate-fade-in">
      <div className="wizard-modal animate-slide-up">
        <button className="wizard-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="wizard-header">
          <h2>Finalizar Evento</h2>
          <div className="wizard-progress">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>
        </div>

        <div className="wizard-body">
          {step === 1 && (
            <div className="wizard-step">
              <h3>O que sobrou?</h3>
              <p>Nos ajude a melhorar o algoritmo. Informe o que sobrou (Carnes, bebidas, etc):</p>
              <textarea 
                placeholder="Ex: Sobrou 1kg de carne e 2 fardos de cerveja..."
                value={feedback.sobras}
                onChange={e => setFeedback({...feedback, sobras: e.target.value})}
              />
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3>O que faltou?</h3>
              <p>Alguém ficou com sede? Faltou carvão?</p>
              <textarea 
                placeholder="Ex: Faltou refrigerante zero..."
                value={feedback.faltas}
                onChange={e => setFeedback({...feedback, faltas: e.target.value})}
              />
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3>Nota Fiscal & Fechamento</h3>
              <p>Anexe a nota fiscal dos gastos para controle financeiro futuro.</p>
              
              <div className="upload-area">
                <input type="file" id="nf-upload" hidden onChange={handleFileUpload} accept="image/*,.pdf" />
                <label htmlFor="nf-upload" className="upload-label">
                  {feedback.notaFiscal ? (
                    <div className="file-success">
                      <CheckCircle size={32} color="#4CAF50" />
                      <span>{feedback.notaFiscal.name}</span>
                    </div>
                  ) : (
                    <div className="file-prompt">
                      <Upload size={32} color="#b19cd9" />
                      <span>Toque para anexar a Nota Fiscal</span>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 ? (
            <button className="btn-secondary" onClick={prevStep}>
              <ChevronLeft size={20} /> Voltar
            </button>
          ) : <div></div>}

          {step < 3 ? (
            <button className="btn-primary" onClick={nextStep}>
              Próximo <ChevronRight size={20} />
            </button>
          ) : (
            <button className="btn-primary" onClick={handleFinish}>
              Salvar Relatório <CheckCircle size={20} style={{marginLeft: 8}}/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
