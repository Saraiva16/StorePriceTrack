import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, Check, X, KeyRound, AlertTriangle, ArrowLeft } from 'lucide-react';
import { validateResetPasswordToken, submitResetPassword } from '../services/UserService';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        if (isMounted) {
          setIsTokenValid(false);
          setIsValidating(false);
        }
        return;
      }

      try {
        const valid = await validateResetPasswordToken(token);
        if (isMounted) {
          setIsTokenValid(valid);
        }
      } catch {
        if (isMounted) {
          setIsTokenValid(false);
        }
      } finally {
        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const passwordRules = [
    { id: 'min', label: 'Pelo menos 8 caracteres', valid: password.length >= 8 },
    { id: 'upper', label: 'Uma letra maiúscula (A-Z)', valid: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Uma letra minúscula (a-z)', valid: /[a-z]/.test(password) },
    { id: 'number', label: 'Um número (0-9)', valid: /\d/.test(password) },
    { id: 'special', label: 'Um caractere especial (@, $, !, %, etc.)', valid: /[@$!%*?&#^()_\-+=.;:,<>~/\\{}[\]|]/.test(password) }
  ];

  const isPasswordStrong = passwordRules.every((r) => r.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('Por favor, crie uma senha forte atendendo a todos os requisitos de segurança.');
      return;
    }

    if (password !== confirmPassword) {
      setError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setIsLoading(true);

    try {
      await submitResetPassword({ token, newPassword: password });
      navigate('/login', {
        replace: true,
        state: { message: 'Senha redefinida com sucesso! Entre com sua nova senha.' }
      });
    } catch (err) {
      setError(err.message || 'Erro ao redefinir a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="page-container" style={styles.container}>
        <div style={styles.header} className="animate-slide-up">
          <div style={styles.iconWrapper}>
            <KeyRound size={40} color="var(--text-light)" />
          </div>
          <h1 style={styles.title}>Validando link...</h1>
          <p style={styles.subtitle}>Verificando a validade do seu token de segurança.</p>
        </div>
      </div>
    );
  }

  if (!isTokenValid) {
    return (
      <div className="page-container" style={styles.container}>
        <div style={styles.header} className="animate-slide-up">
          <div style={{ ...styles.iconWrapper, backgroundColor: '#fee2e2' }}>
            <AlertTriangle size={40} color="#dc2626" />
          </div>
          <h1 style={styles.title}>Link Expirado ou Inválido</h1>
          <p style={styles.subtitle}>
            Este link de recuperação expirou, já foi utilizado ou não é válido.
          </p>
        </div>

        <div style={styles.form} className="animate-slide-up">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            style={styles.submitBtn}
          >
            Solicitar Novo Link de Recuperação
          </button>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <span
              onClick={() => navigate('/login')}
              style={{ color: 'var(--accent-color)', fontSize: '14px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Voltar para o Login
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={styles.container}>
      <div style={styles.header} className="animate-slide-up">
        <div style={styles.iconWrapper}>
          <KeyRound size={40} color="var(--text-light)" />
        </div>
        <h1 style={styles.title}>Criar Nova Senha</h1>
        <p style={styles.subtitle}>Defina uma nova senha segura para a sua conta</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form} className="animate-slide-up">
        {error && <div style={styles.errorBanner}>{error}</div>}

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>
            <Lock size={20} color="var(--icon-color)" />
          </div>
          <input
            type="password"
            placeholder="Nova Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
            autoFocus
          />
        </div>

        {/* Indicadores de requisitos de senha */}
        <div style={styles.requirementsCard}>
          <p style={styles.requirementsTitle}>Requisitos para uma senha segura:</p>
          <div style={styles.rulesList}>
            {passwordRules.map((rule) => (
              <div key={rule.id} style={styles.ruleItem}>
                {rule.valid ? (
                  <Check size={16} color="#10b981" style={{ minWidth: '16px' }} />
                ) : (
                  <X size={16} color="#ef4444" style={{ minWidth: '16px' }} />
                )}
                <span style={{ ...styles.ruleText, color: rule.valid ? '#10b981' : '#64748b' }}>
                  {rule.label}
                </span>
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
            placeholder="Confirmar Nova Senha"
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
            opacity: isLoading || !isPasswordStrong || !confirmPassword ? 0.6 : 1,
            cursor: isLoading || !isPasswordStrong || !confirmPassword ? 'not-allowed' : 'pointer'
          }}
          disabled={isLoading || !isPasswordStrong || !confirmPassword}
        >
          {isLoading ? 'Redefinindo...' : 'Salvar Nova Senha'}
          {!isLoading && <ArrowRight size={20} style={{ marginLeft: '8px' }} />}
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <span
            onClick={() => navigate('/login')}
            style={{ color: '#777', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Cancelar e ir para o Login
          </span>
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
    minHeight: '100%'
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
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
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--text-dark)',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    maxWidth: '340px',
    lineHeight: '1.4'
  },
  form: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
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
    fontSize: '16px',
    fontFamily: 'inherit',
    color: 'var(--text-dark)',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  requirementsCard: {
    backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
    padding: '14px 16px',
    borderRadius: '14px',
    border: '1px solid var(--border-color, #e2e8f0)'
  },
  requirementsTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-dark)',
    margin: '0 0 8px 0'
  },
  rulesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  ruleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  ruleText: {
    fontSize: '12px',
    fontWeight: '500'
  },
  submitBtn: {
    width: '100%',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--text-light)',
    border: 'none',
    borderRadius: '16px',
    padding: '18px',
    fontSize: '16px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(245, 156, 141, 0.4)',
    transition: 'transform 0.2s, opacity 0.2s',
    marginTop: '6px'
  },
  errorBanner: {
    backgroundColor: '#ffe5e5',
    color: '#d93025',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default ResetPassword;
