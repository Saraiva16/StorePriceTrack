import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { useVersionCheck } from '../../hooks/useVersionCheck';
import './VersionUpdatePrompt.css';

/**
 * Notificador flutuante discreto para avisar o usuário de novas versões em produção.
 */
export default function VersionUpdatePrompt() {
  const { hasUpdate, applyUpdate, dismissUpdate } = useVersionCheck();

  if (!hasUpdate) {
    return null;
  }

  return (
    <div className="version-update-prompt" role="alert" aria-live="polite">
      <div className="version-prompt-content">
        <Sparkles size={20} className="version-prompt-icon" />
        <div className="version-prompt-texts">
          <span className="version-prompt-title">Nova versão disponível</span>
          <span className="version-prompt-subtitle">Toque para atualizar agora</span>
        </div>
      </div>

      <div className="version-prompt-actions">
        <button
          type="button"
          onClick={applyUpdate}
          className="version-prompt-btn-update"
          aria-label="Atualizar aplicativo agora"
        >
          <RefreshCw size={14} />
          <span>Atualizar</span>
        </button>

        <button
          type="button"
          onClick={dismissUpdate}
          className="version-prompt-btn-dismiss"
          aria-label="Fechar notificação de atualização"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

