import { useState, useEffect, useCallback } from 'react';

/**
 * Hook customizado para monitoramento e detecção de novas versões em produção.
 * Trata o ciclo de vida de aplicações PWA / Mobile Web sem necessidade de Service Worker.
 */
export function useVersionCheck() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);

  // Versão embutida no bundle durante o build
  const currentBuildTime = typeof __APP_BUILD_TIME__ !== 'undefined' ? Number(__APP_BUILD_TIME__) : null;

  const checkVersion = useCallback(async () => {
    if (!currentBuildTime) {
      return;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`/version.json?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data && data.version && Number(data.version) > currentBuildTime) {
        setHasUpdate(true);
        setLatestVersion(data);
      }
    } catch {
      // Falhas transitórias de conexão são tratadas silenciosamente
    }
  }, [currentBuildTime]);

  useEffect(() => {
    // 1. Escuta o erro nativo do Vite para chunks ausentes após novo deploy
    const handlePreloadError = (event) => {
      event?.preventDefault?.();
      // Recarrega imediatamente para puxar os novos bundles
      window.location.reload();
    };

    window.addEventListener('vite:preloadError', handlePreloadError);

    // 2. Escuta quando o usuário volta para o app no smartphone (multitarefa)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 3. Verificação inicial leve e agendamento periódico (a cada 10 minutos)
    const initialTimer = setTimeout(checkVersion, 3000);
    const intervalTimer = setInterval(checkVersion, 10 * 60 * 1000);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [checkVersion]);

  const applyUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  const dismissUpdate = useCallback(() => {
    setIsDismissed(true);
  }, []);

  return {
    hasUpdate: hasUpdate && !isDismissed,
    latestVersion,
    currentVersion: currentBuildTime,
    applyUpdate,
    dismissUpdate,
    checkVersion
  };
}

