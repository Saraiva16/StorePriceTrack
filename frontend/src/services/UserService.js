const API_BASE = '/api/users';

/**
 * Busca os dados cadastrais do perfil do usuário logado
 */
export async function fetchUserProfile() {
  const res = await fetch(`${API_BASE}/profile`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro ao carregar dados do perfil.');
  }

  return res.json();
}

/**
 * Atualiza nome de usuário e chave Pix do usuário logado
 */
export async function updateUserProfile({ username, pixKey }) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ 
      username, 
      pixKey, 
      pix_key: pixKey 
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro ao atualizar dados do perfil.');
  }

  return res.json();
}

/**
 * Altera a senha do usuário com validação de senha atual
 */
export async function changeUserPassword({ currentPassword, newPassword }) {
  const res = await fetch(`${API_BASE}/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ 
      currentPassword, 
      current_password: currentPassword, 
      newPassword, 
      new_password: newPassword 
    })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Erro ao alterar senha.');
  }

  return res.json();
}
