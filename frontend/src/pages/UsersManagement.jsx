import React, { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Shield, X, Check, Search } from 'lucide-react';
import { useAuth } from '../components/Auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', password: '' });
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Erro ao carregar usuários.');
      }
    } catch (err) {
      setError('Erro de conexão ao buscar usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (user.id === id) {
      alert("Você não pode excluir o próprio usuário logado!");
      return;
    }
    
    if (!window.confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const text = await res.text();
        alert(`Erro: ${text}`);
      }
    } catch (err) {
      alert('Erro de conexão ao excluir.');
    }
  };

  const startEditing = (u) => {
    setEditingId(u.id);
    setEditForm({ username: u.username, password: '' });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({ username: '', password: '' });
  };

  const handleUpdate = async (id) => {
    try {
      const payload = {
        username: editForm.username,
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(users.map(u => u.id === id ? updatedUser : u));
        setEditingId(null);
      } else {
        const text = await res.text();
        alert(`Erro: ${text}`);
      }
    } catch (err) {
      alert('Erro de conexão ao atualizar.');
    }
  };

  return (
    <div className="page-container" style={styles.container}>
      <div style={styles.header} className="animate-slide-up">
        <div style={styles.iconWrapper}>
          <Users size={32} color="var(--text-light)" />
        </div>
        <h1 style={styles.title}>Gerenciamento</h1>
        <p style={styles.subtitle}>Gerencie os acessos do sistema</p>
      </div>

      {error && <div style={styles.errorBanner}>{error}</div>}

      <div style={styles.listContainer} className="animate-slide-up">
        {isLoading ? (
          <div style={styles.loading}>Carregando usuários...</div>
        ) : (
          users.map(u => (
            <div key={u.id} style={styles.card}>
              {editingId === u.id ? (
                <div style={styles.editForm}>
                  <div style={styles.inputGroup}>
                    <input 
                      style={styles.input}
                      value={editForm.username}
                      onChange={e => setEditForm({...editForm, username: e.target.value})}
                      placeholder="Novo nome"
                    />
                    <input 
                      style={styles.input}
                      type="password"
                      value={editForm.password}
                      onChange={e => setEditForm({...editForm, password: e.target.value})}
                      placeholder="Nova senha (opcional)"
                    />
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => handleUpdate(u.id)} style={styles.iconBtnSuccess}>
                      <Check size={20} />
                    </button>
                    <button onClick={cancelEditing} style={styles.iconBtnDanger}>
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.userInfo}>
                    <div style={styles.avatar}>
                      <Shield size={24} color="var(--accent-color)" />
                    </div>
                    <div>
                      <h3 style={styles.userName}>{u.username}</h3>
                      <span style={styles.userId}>ID: {u.id} {user && user.id === u.id && '(Você)'}</span>
                    </div>
                  </div>
                  <div style={styles.actions}>
                    <button onClick={() => startEditing(u)} style={styles.iconBtn}>
                      <Edit2 size={20} />
                    </button>
                    <button onClick={() => handleDelete(u.id)} style={styles.iconBtnDanger}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    paddingBottom: '80px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    backgroundColor: 'var(--card-primary-bg)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 8px 24px rgba(137, 180, 177, 0.3)'
  },
  title: {
    fontSize: '24px',
    color: 'var(--text-dark)',
    marginBottom: '4px'
  },
  subtitle: {
    color: '#777',
    fontSize: '14px'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    animationDelay: '0.1s'
  },
  card: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '20px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  avatar: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    backgroundColor: '#f0f5f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-dark)',
    margin: 0
  },
  userId: {
    fontSize: '13px',
    color: '#888'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  iconBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    color: '#555',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  iconBtnDanger: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#ffe5e5',
    color: '#d93025',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  iconBtnSuccess: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#e6f4ea',
    color: '#137333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  editForm: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: '12px'
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid transparent',
    backgroundColor: '#f5f5f5',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    padding: '24px'
  },
  errorBanner: {
    backgroundColor: '#ffe5e5',
    color: '#d93025',
    padding: '12px',
    borderRadius: '12px',
    textAlign: 'center',
    fontSize: '14px',
    marginBottom: '20px'
  }
};

export default UsersManagement;
