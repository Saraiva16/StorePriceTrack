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
 * Atualiza nome de usuário, e-mail e chave Pix do usuário logado
 */
export async function updateUserProfile({ username, email, pixKey }) {
  const res = await fetch(`${API_BASE}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ 
      username, 
      email,
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

/**
 * Solicita o envio de e-mail de recuperação de senha
 */
export async function requestForgotPassword(email) {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email: email ? email.trim() : '' })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Falha ao processar solicitação de recuperação.');
  }

  return data;
}

/**
 * Valida se um token de recuperação de senha ainda é válido e não expirou
 */
export async function validateResetPasswordToken(token) {
  if (!token) return false;
  const res = await fetch(`/api/auth/validate-reset-token?token=${encodeURIComponent(token.trim())}`, {
    headers: {
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json().catch(() => ({ valid: false }));
  return !!data.valid;
}

/**
 * Redefine a senha utilizando o token de recuperação e a nova senha
 */
export async function submitResetPassword({ token, newPassword }) {
  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      token: token ? token.trim() : '',
      newPassword,
      new_password: newPassword
    })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Não foi possível redefinir a senha.');
  }

  return data;
}
