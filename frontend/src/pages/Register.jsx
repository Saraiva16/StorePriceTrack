import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthContext';
import { UserPlus, Lock, User, Mail, ArrowRight, Check, X } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const passwordRules = [
    { id: 'min', label: 'Pelo menos 8 caracteres', valid: password.length >= 8 },
    { id: 'upper', label: 'Uma letra maiúscula (A-Z)', valid: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Uma letra minúscula (a-z)', valid: /[a-z]/.test(password) },
    { id: 'number', label: 'Um número (0-9)', valid: /\d/.test(password) },
    { id: 'special', label: 'Um caractere especial (@, $, !, etc.)', valid: /[@$!%*?&#^()_\-+=.;:,<>~/\\{}[\]|]/.test(password) }
  ];

  const isPasswordStrong = passwordRules.every((r) => r.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!isPasswordStrong) {
      setError('Por favor, crie uma senha forte atendendo a todos os requisitos.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: username.trim(), 
          email: email.trim().toLowerCase(), 
          password 
        })
      });

      if (res.ok) {
        setSuccess('Cadastro realizado com sucesso! Redirecionando...');
        
        // Autentica automaticamente o usuário recém-criado usando o e-mail cadastrado
        try {
          const loggedIn = await login(email.trim().toLowerCase(), password);
          if (loggedIn) {
            const destination = location.state?.from?.pathname 
              ? `${location.state.from.pathname}${location.state.from.search || ''}` 
              : (location.state?.from || '/home');
            navigate(destination, { replace: true });
            return;
          }
        } catch (authErr) {
          console.warn('Erro ao realizar login automático:', authErr);
        }

        navigate('/login', { replace: true, state: { from: location.state?.from } });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Erro ao realizar o cadastro.');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      <div style={styles.header} className="animate-slide-up">
        <div style={styles.iconWrapper}>
          <UserPlus size={40} color="var(--text-light)" />
        </div>
        <h1 style={styles.title}>Novo Usuário</h1>
        <p style={styles.subtitle}>Crie uma conta segura para acessar o sistema</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form} className="animate-slide-up">
        {error && <div style={styles.errorBanner}>{error}</div>}
        {success && <div style={styles.successBanner}>{success}</div>}

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>
            <User size={20} color="var(--icon-color)" />
          </div>
          <input
            type="text"
            placeholder="Nome ou Apelido"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>
            <Mail size={20} color="var(--icon-color)" />
          </div>
          <input
            type="email"
            placeholder="Seu E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>
            <Lock size={20} color="var(--icon-color)" />
          </div>
          <input
            type="password"
            placeholder="Senha Forte"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        {/* Checklist visual de requisitos de senha forte */}
        <div style={styles.passwordRulesBox}>
          <span style={styles.passwordRulesTitle}>Requisitos para uma senha forte:</span>
          <div style={styles.rulesList}>
            {passwordRules.map((rule) => (
              <div 
                key={rule.id} 
                style={{
                  ...styles.ruleItem,
                  color: rule.valid ? '#16a34a' : (password.length > 0 ? '#dc2626' : '#64748b')
                }}
              >
                {rule.valid ? <Check size={14} color="#16a34a" /> : <X size={14} color={password.length > 0 ? '#dc2626' : '#94a3b8'} />}
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>
            <Lock size={20} color="var(--icon-color)" />
          </div>
          <input
            type="password"
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <button 
          type="submit" 
          style={{
            ...styles.submitBtn, 
            opacity: isLoading || !isPasswordStrong ? 0.7 : 1,
            cursor: isLoading || !isPasswordStrong ? 'not-allowed' : 'pointer'
          }}
          disabled={isLoading || !isPasswordStrong}
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
          {!isLoading && <ArrowRight size={20} />}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p style={{ color: '#777', fontSize: '14px' }}>
            Já tem uma conta?{' '}
            <span 
              onClick={() => navigate('/login', { state: { from: location.state?.from } })} 
              style={{ color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Entrar
            </span>
          </p>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    justifyContent: 'center',
    padding: '40px 24px',
    backgroundColor: 'var(--bg-color)',
    height: '100%'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  iconWrapper: {
    width: '80px',
    height: '80px',
    backgroundColor: 'var(--card-primary-bg)',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 8px 24px rgba(137, 180, 177, 0.4)'
  },
  title: {
    fontSize: '28px',
    color: 'var(--text-dark)',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#777',
    fontSize: '15px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    animationDelay: '0.1s'
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '16px 16px 16px 48px',
    borderRadius: '16px',
    border: '2px solid transparent',
    backgroundColor: 'var(--text-light)',
    fontSize: '15px',
    fontFamily: 'inherit',
    color: 'var(--text-dark)',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  passwordRulesBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: '12px',
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  passwordRulesTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569'
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  ruleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    transition: 'color 0.2s ease'
  },
  submitBtn: {
    marginTop: '12px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--text-light)',
    border: 'none',
    borderRadius: '16px',
    padding: '16px',
    fontSize: '17px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(245, 156, 141, 0.4)',
    transition: 'transform 0.2s, opacity 0.2s'
  },
  errorBanner: {
    backgroundColor: '#ffe5e5',
    color: '#d93025',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500'
  },
  successBanner: {
    backgroundColor: '#e6f4ea',
    color: '#137333',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default Register;
