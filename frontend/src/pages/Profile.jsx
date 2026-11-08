import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  LogOut, 
  Check, 
  AlertCircle,
  CreditCard,
  ShieldCheck,
  RefreshCw,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { useAuth } from '../components/Auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  fetchUserProfile, 
  updateUserProfile, 
  changeUserPassword 
} from '../services/UserService';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, updatePixKey } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  // Estados dos Dados Cadastrais
  const [username, setUsername] = useState(user?.username || '');
  const [pixKey, setPixKey] = useState(user?.pixKey || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Estados de Alteração de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Carrega dados frescos do perfil
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await fetchUserProfile();
      if (data) {
        setUsername(data.username || '');
        setPixKey(data.pixKey || '');
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do perfil:', err);
    }
  };

  // Salvar Dados Cadastrais
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!username.trim()) {
      setProfileError('O nome de usuário não pode ficar vazio.');
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateUserProfile({
        username: username.trim(),
        pixKey: pixKey.trim()
      });

      setUsername(updated.username);
      setPixKey(updated.pixKey || '');
      if (updatePixKey) updatePixKey(updated.pixKey || '');

      setProfileSuccess('Dados cadastrais atualizados com sucesso!');
      setTimeout(() => setProfileSuccess(''), 3500);
    } catch (err) {
      setProfileError(err.message || 'Erro ao atualizar dados cadastrais.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Alterar Senha
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Informe sua senha atual.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError('A nova senha deve ser diferente da senha atual.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await changeUserPassword({
        currentPassword,
        newPassword
      });

      setPasswordSuccess('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3500);
    } catch (err) {
      setPasswordError(err.message || 'Erro ao alterar senha.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (window.confirm('Deseja realmente sair da sua conta?')) {
      try {
        await logout();
        navigate('/login', { replace: true });
      } catch (err) {
        console.error('Erro ao efetuar logout:', err);
        navigate('/login', { replace: true });
      }
    }
  };

  const initialLetter = (username || user?.username || 'U').charAt(0).toUpperCase();

  return (
    <div className="profile-page-container animate-slide-up">
      {/* Top Header */}
      <header className="profile-header">
        <button 
          type="button" 
          className="profile-back-btn" 
          onClick={() => navigate('/home')}
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="profile-header-title">Meu Perfil</h1>
        <div style={{ width: 40 }} /> {/* Espaçador para centralizar título */}
      </header>

      {/* Hero Card do Usuário */}
      <div className="profile-hero-card">
        <div className="profile-avatar-circle">
          {initialLetter}
        </div>
        <div className="profile-hero-info">
          <h2>{username || user?.username || 'Usuário'}</h2>
          <div className="profile-badge-row">
            <span className="profile-badge">
              <ShieldCheck size={14} /> Conta Ativa
            </span>
            {user?.id && (
              <span className="profile-badge-subtle">ID #{user.id}</span>
            )}
          </div>
        </div>
      </div>

      {/* Card 1: Dados Cadastrais */}
      <section className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-icon-box">
            <UserIcon size={20} color="#2a9d8f" />
          </div>
          <div>
            <h3>Dados Cadastrais</h3>
            <p>Seu nome e chave Pix para rateio de despesas</p>
          </div>
        </div>

        {profileSuccess && (
          <div className="profile-feedback-banner success">
            <Check size={16} />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div className="profile-feedback-banner error">
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="profile-form">
          <div className="profile-form-group">
            <label htmlFor="input-username">Nome de Usuário</label>
            <input 
              id="input-username"
              type="text"
              className="profile-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Seu nome no sistema"
              required
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="input-pix">
              <CreditCard size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
              Chave Pix (opcional)
            </label>
            <input 
              id="input-pix"
              type="text"
              className="profile-input"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="CPF, E-mail, Celular ou Chave Aleatória"
            />
            <span className="profile-input-hint">
              Utilizada para outros participantes pagarem você em rateios de viagens.
            </span>
          </div>

          <button 
            type="submit" 
            className="profile-btn-primary" 
            disabled={isSavingProfile}
          >
            <Save size={18} />
            {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </section>

      {/* Card 2: Segurança e Senha */}
      <section className="profile-card">
        <div className="profile-card-header">
          <div className="profile-card-icon-box">
            <Lock size={20} color="#e76f51" />
          </div>
          <div>
            <h3>Segurança e Senha</h3>
            <p>Atualize sua senha de acesso</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="profile-feedback-banner success">
            <Check size={16} />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="profile-feedback-banner error">
            <AlertCircle size={16} />
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="profile-form">
          <div className="profile-form-group">
            <label htmlFor="input-current-pass">Senha Atual</label>
            <div className="profile-input-wrapper">
              <input 
                id="input-current-pass"
                type={showCurrentPassword ? "text" : "password"}
                className="profile-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                required
              />
              <button 
                type="button" 
                className="profile-eye-btn"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                tabIndex="-1"
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="input-new-pass">Nova Senha</label>
            <div className="profile-input-wrapper">
              <input 
                id="input-new-pass"
                type={showNewPassword ? "text" : "password"}
                className="profile-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                required
              />
              <button 
                type="button" 
                className="profile-eye-btn"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex="-1"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="input-confirm-pass">Confirmar Nova Senha</label>
            <input 
              id="input-confirm-pass"
              type="password"
              className="profile-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </div>

          <button 
            type="submit" 
            className="profile-btn-secondary" 
            disabled={isSavingPassword}
          >
            <Lock size={18} />
            {isSavingPassword ? 'Atualizando...' : 'Atualizar Senha'}
          </button>
        </form>
      </section>

      {/* Card 3: Aparência / Modo Escuro */}
      <section className="profile-card theme-card">
        <div className="profile-theme-content">
          <div className="profile-theme-info">
            <div className="profile-card-icon-box" style={{ background: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.15)' }}>
              {isDark ? <Moon size={20} color="#fbbf24" /> : <Sun size={20} color="#f59e0b" />}
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text-dark)' }}>
                Modo Escuro
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isDark ? 'Tema escuro ativo para visualização noturna' : 'Tema claro ativo no sistema'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className={`profile-switch-toggle ${isDark ? 'active' : ''}`}
            onClick={toggleTheme}
            aria-label="Alternar modo escuro"
            title={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
          >
            <span className="profile-switch-handle" />
          </button>
        </div>
      </section>

      {/* Card 4: Versão do Aplicativo */}
      <section className="profile-card version-card">
        <div className="profile-version-content">
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text-dark)' }}>Versão do Sistema</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {typeof __APP_BUILD_TIME__ !== 'undefined'
                ? `Build: ${new Date(Number(__APP_BUILD_TIME__)).toLocaleString('pt-BR')}`
                : 'Ambiente de desenvolvimento'}
            </p>
          </div>
          <button 
            type="button" 
            className="profile-btn-reload"
            onClick={() => window.location.reload()}
            title="Recarregar aplicativo para buscar a versão mais recente"
          >
            <RefreshCw size={16} />
            Recarregar App
          </button>
        </div>
      </section>

      {/* Card 5: Encerrar Sessão */}
      <section className="profile-card logout-card">
        <div className="profile-logout-content">
          <div>
            <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#c53030' }}>Sair da Conta</h4>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Encerra a sessão atual e volta para o login.
            </p>
          </div>
          <button 
            type="button" 
            className="profile-btn-logout"
            onClick={handleLogout}
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </section>
    </div>
  );
}
