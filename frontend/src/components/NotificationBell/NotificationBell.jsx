import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, X, FileText, BellRing, Volume2, ShieldCheck, Loader2 } from 'lucide-react';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  subscribeToWebPush,
  sendTestPush
} from '../../services/notificationService';
import './NotificationBell.css';

export default function NotificationBell() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [isPushActive, setIsPushActive] = useState(false);
  const [pushStatusMessage, setPushStatusMessage] = useState('');
  const dropdownRef = useRef(null);

  // Checa permissão de notificação do navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsPushActive(Notification.permission === 'granted');
    }
  }, []);

  // Carrega contagem de não lidas e atualiza periodicamente
  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (e) {
      // Ignora erro em caso de offline
    }
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // 30s polling
    const onFocus = () => loadUnreadCount();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Carrega lista ao abrir o painel
  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(0, 20);
      setNotifications(data.content || []);
    } catch (e) {
      console.error('Erro ao carregar notificações:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemClick = async (notif) => {
    if (!notif.read) {
      try {
        await markAsRead(notif.id);
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (e) {
        console.error(e);
      }
    }

    setIsOpen(false);
    if (notif.type === 'RECEIPT_CURATION_PENDING') {
      navigate('/admin/curation');
    }
  };

  const handleActivatePush = async () => {
    setIsSubscribingPush(true);
    setPushStatusMessage('');
    try {
      await subscribeToWebPush();
      setIsPushActive(true);
      setPushStatusMessage('Notificações no dispositivo ativadas com sucesso!');
    } catch (e) {
      setPushStatusMessage(e.message || 'Falha ao ativar notificações push.');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  const handleTestPush = async () => {
    try {
      await sendTestPush();
      setPushStatusMessage('Alerta de teste enviado! Seu dispositivo deve apitar em instantes.');
    } catch (e) {
      setPushStatusMessage('Erro ao enviar teste: ' + (e.message || ''));
    }
  };

  return (
    <div className="notification-bell-container" ref={dropdownRef}>
      <button
        type="button"
        className="bell-trigger-btn"
        onClick={handleToggle}
        aria-label="Abrir notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="notification-backdrop" onClick={() => setIsOpen(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notificações</h3>
              <div className="notification-actions">
                {unreadCount > 0 && (
                  <button type="button" className="btn-mark-all-read" onClick={handleMarkAllRead}>
                    <CheckCheck size={14} />
                    <span>Lidas</span>
                  </button>
                )}
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setIsOpen(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Banner de Ativação do Web Push (Apito / Celular) */}
            <div className={`push-activation-card ${isPushActive ? 'active' : 'inactive'}`}>
              <div className={`push-card-header ${isPushActive ? 'active' : ''}`}>
                {isPushActive ? <ShieldCheck size={16} /> : <BellRing size={16} />}
                <span>{isPushActive ? 'Alertas no Dispositivo Ativos' : 'Apitar no Celular/PC'}</span>
              </div>

              {!isPushActive ? (
                <button
                  type="button"
                  className="push-action-btn"
                  onClick={handleActivatePush}
                  disabled={isSubscribingPush}
                >
                  {isSubscribingPush ? <Loader2 size={14} className="spinner" /> : <Volume2 size={14} />}
                  <span>{isSubscribingPush ? 'Ativando...' : 'Ativar Web Push no Dispositivo'}</span>
                </button>
              ) : (
                <button type="button" className="push-test-btn" onClick={handleTestPush}>
                  🔔 Testar Apito no Dispositivo
                </button>
              )}

              {pushStatusMessage && (
                <span style={{ fontSize: '11px', color: isPushActive ? '#15803d' : '#b91c1c' }}>
                  {pushStatusMessage}
                </span>
              )}
            </div>

            {/* Lista de Notificações */}
            <div className="notification-list">
              {isLoading ? (
                <div className="notif-empty">Carregando avisos...</div>
              ) : notifications.length === 0 ? (
                <div className="notif-empty">Nenhuma notificação no momento.</div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                    onClick={() => handleItemClick(n)}
                  >
                    <div className="notif-icon-box">
                      <FileText size={18} />
                    </div>
                    <div className="notif-content">
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-msg">{n.message}</div>
                      <div className="notif-time">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : ''}
                      </div>
                    </div>
                    {!n.read && <span className="unread-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
