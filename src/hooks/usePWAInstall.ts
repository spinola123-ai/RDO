import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (typeof window !== 'undefined' && (window as any).__pwa_prompt) || null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed on phone or desktop)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    setIsInstalled(isStandalone);

    // Detect device platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobile = isIOSDevice || isAndroidDevice;

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsDesktop(!isMobile);

    // Detect iframe execution
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check if global prompt was already captured
    if ((window as any).__pwa_prompt) {
      setDeferredPrompt((window as any).__pwa_prompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).__pwa_prompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).__pwa_prompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Direct installation trigger
  const install = async (): Promise<boolean> => {
    // If inside an iframe (like AI Studio preview), opening in top/new tab enables native prompt directly
    if (window.self !== window.top) {
      window.open(window.location.href, '_blank');
      return true;
    }

    const prompt = deferredPrompt || (window as any).__pwa_prompt;

    if (prompt && typeof prompt.prompt === 'function') {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          (window as any).__pwa_prompt = null;
          return true;
        }
        return false;
      } catch (err) {
        console.error('Error triggering PWA install:', err);
      }
    }

    // If browser prompt is not ready, open standalone window
    window.open(window.location.href, '_blank');
    return true;
  };

  return {
    isInstallable: !!(deferredPrompt || (typeof window !== 'undefined' && (window as any).__pwa_prompt)),
    isInstalled,
    isIOS,
    isAndroid,
    isDesktop,
    isInIframe,
    install,
  };
}
