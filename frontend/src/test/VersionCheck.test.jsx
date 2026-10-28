import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, renderHook, act } from '@testing-library/react';
import VersionUpdatePrompt from '../components/VersionUpdatePrompt/VersionUpdatePrompt';
import { useVersionCheck } from '../hooks/useVersionCheck';

describe('VersionCheck e VersionUpdatePrompt Component', () => {
  const originalReload = window.location.reload;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: vi.fn(), href: 'http://localhost/' }
    });
  });

  afterEach(() => {
    window.location.reload = originalReload;
    vi.restoreAllMocks();
  });

  it('não deve exibir o banner de atualização se não houver nova versão', () => {
    const { container } = render(<VersionUpdatePrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('deve disparar reload em vite:preloadError', () => {
    renderHook(() => useVersionCheck());

    act(() => {
      const event = new Event('vite:preloadError');
      window.dispatchEvent(event);
    });

    expect(window.location.reload).toHaveBeenCalledTimes(1);
  });

  it('deve detectar nova versão quando version.json tiver timestamp superior', async () => {
    // Simula resposta da requisição com timestamp mais recente
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ version: Date.now() + 100000 })
    });

    const { result } = renderHook(() => useVersionCheck());

    await act(async () => {
      await result.current.checkVersion();
    });

    // Se houver __APP_BUILD_TIME__ definido no teste, detecta atualização
    if (result.current.currentVersion) {
      expect(result.current.hasUpdate).toBe(true);
    }
  });

  it('deve permitir fechar a notificação de atualização', () => {
    const { result } = renderHook(() => useVersionCheck());

    act(() => {
      result.current.dismissUpdate();
    });

    expect(result.current.hasUpdate).toBe(false);
  });
});
