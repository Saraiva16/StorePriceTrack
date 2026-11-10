import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { requestForgotPassword } from '../services/UserService';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await requestForgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Erro ao processar solicitação de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      <div style={styles.header} className="animate-slide-up">
        <div style={styles.iconWrapper}>
          <ShieldCheck size={40} color="var(--text-light)" />
        </div>
        <h1 style={styles.title}>Recuperar Senha</h1>
        <p style={styles.subtitle}>
          {submitted
            ? 'Instruções enviadas para seu e-mail'
            : 'Informe o e-mail cadastrado na sua conta para enviarmos o link de recuperação'}
        </p>
      </div>

      <div style={styles.form} className="animate-slide-up">
        {error && <div style={styles.errorBanner}>{error}</div>}

        {submitted ? (
          <div style={styles.successCard}>
            <div style={styles.successIconWrapper}>
              <CheckCircle2 size={48} color="#10b981" />
            </div>
            <h3 style={styles.successTitle}>Verifique seu e-mail</h3>
            <p style={styles.successText}>
              Se houver uma conta cadastrada para <strong>{email}</strong>, você receberá um link com validade de <strong>15 minutos</strong> para redefinir sua senha.
            </p>
            <p style={styles.subtext}>
              Não encontrou o e-mail? Verifique também sua caixa de <em>Spam</em> ou <em>Lixo eletrônico</em>.
            </p>

            <button
              type="button"
              onClick={() => navigate('/login')}
              style={styles.submitBtn}
            >
              <ArrowLeft size={18} style={{ marginRight: '8px' }} />
              Voltar para o Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={styles.inputGroup}>
              <div style={styles.inputIcon}>
                <Mail size={20} color="var(--icon-color)" />
              </div>
              <input
                type="email"
                placeholder="Seu e-mail cadastrado"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              style={{ ...styles.submitBtn, opacity: isLoading ? 0.7 : 1 }}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
              {!isLoading && <ArrowRight size={20} />}
            </button>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <p style={{ color: '#777', fontSize: '14px' }}>
                Lembrou sua senha?{' '}
                <span
                  onClick={() => navigate('/login')}
                  style={{ color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Voltar para o Login
                </span>
              </p>
            </div>
          </form>
        )}
      </div>
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
    marginBottom: '36px',
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
    gap: '16px'
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px'
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
    padding: '18px 16px 18px 48px',
    borderRadius: '16px',
    border: '2px solid transparent',
    backgroundColor: 'var(--text-light)',
    fontSize: '16px',
    fontFamily: 'inherit',
    color: 'var(--text-dark)',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
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
    transition: 'transform 0.2s'
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
  successCard: {
    backgroundColor: 'var(--card-bg, #ffffff)',
    borderRadius: '20px',
    padding: '28px 20px',
    textAlign: 'center',
    border: '1px solid var(--border-color, #e2e8f0)',
    boxShadow: '0 10px 25px rgba(0,0,0,0.05)'
  },
  successIconWrapper: {
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'center'
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'var(--text-dark)',
    margin: '0 0 10px 0'
  },
  successText: {
    fontSize: '14px',
    color: 'var(--text-dark)',
    lineHeight: '1.5',
    margin: '0 0 12px 0'
  },
  subtext: {
    fontSize: '12px',
    color: '#888',
    lineHeight: '1.4',
    margin: '0 0 24px 0'
  }
};

export default ForgotPassword;
