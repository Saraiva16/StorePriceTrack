import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/Auth/AuthContext';
import { ShoppingBag, Lock, User, ArrowRight } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/home', { replace: true });
      } else {
        setError('Usuário ou senha inválidos.');
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
          <ShoppingBag size={40} color="var(--text-light)" />
        </div>
        <h1 style={styles.title}>StorePrice Track</h1>
        <p style={styles.subtitle}>Acesse sua conta para continuar</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form} className="animate-slide-up">
        {error && <div style={styles.errorBanner}>{error}</div>}

        <div style={styles.inputGroup}>
          <div style={styles.inputIcon}>
            <User size={20} color="var(--icon-color)" />
          </div>
          <input
            type="text"
            placeholder="Nome de Usuário"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <button 
          type="submit" 
          style={{...styles.submitBtn, opacity: isLoading ? 0.7 : 1}}
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
          {!isLoading && <ArrowRight size={20} />}
        </button>
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
    marginBottom: '48px',
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
    marginBottom: '24px',
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
    gap: '20px',
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
    padding: '18px 16px 18px 48px',
    borderRadius: '16px',
    border: '2px solid transparent',
    backgroundColor: 'var(--text-light)',
    fontSize: '16px',
    fontFamily: 'inherit',
    color: 'var(--text-dark)',
    outline: 'none',
    transition: 'border-color 0.3s, box-shadow 0.3s',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  submitBtn: {
    marginTop: '12px',
    backgroundColor: 'var(--accent-color)',
    color: 'var(--text-light)',
    border: 'none',
    borderRadius: '16px',
    padding: '18px',
    fontSize: '18px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  }
};

export default Login;
