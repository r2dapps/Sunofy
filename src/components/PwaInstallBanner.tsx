import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface PwaInstallBannerProps {
  onShowToast: (msg: string) => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onShowToast }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('sunofy_pwa_dismissed') === 'true';
  });

  const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // Check if app is running as standalone or installed PWA
    const checkStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.location.search.includes('mode=pwa');
    setIsStandalone(checkStandalone);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPwaPrompt = e;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone || isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onShowToast('Thank you for installing Sunofy App!');
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      onShowToast('To install: Open browser menu (⋮) and tap "Add to Home Screen" / "Install App"');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('sunofy_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Floating Banner */}
      <div className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white p-3.5 rounded-2xl shadow-2xl border border-white/20 flex items-center justify-between animate-bounce-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/30 backdrop-blur-md flex items-center justify-center p-1 border border-white/20">
            <img src='./icon-192.png' alt="Sunofy" className="w-full h-full object-cover rounded-lg" />
          </div>
          <div>
            <h4 className="text-xs font-black tracking-tight flex items-center gap-1.5">
              <span>Install Sunofy App</span>
              <span className="px-1.5 py-0.2 rounded bg-white/20 text-[9px] font-mono">PWA</span>
            </h4>
            <p className="text-[10px] text-emerald-100 font-medium">Fast offline streaming & home icon</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 active:scale-95 transition shadow-md flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl p-6 max-w-xs w-full space-y-4 shadow-2xl text-[var(--text-sunofy)] animate-scale-up relative">
            <button
              onClick={() => setShowIosGuide(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--hover-sunofy)] text-[var(--muted-sunofy)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black">Install on iPhone / iPad</h3>
                <p className="text-[10px] text-[var(--muted-sunofy)]">Apple iOS Safari Instructions</p>
              </div>
            </div>

            <div className="space-y-3 text-xs font-medium pt-2">
              <div className="flex items-start gap-2.5 bg-[var(--bg-sunofy)] p-2.5 rounded-xl border border-[var(--border-sunofy)]">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                <p className="text-[11px] leading-relaxed">
                  Tap the <strong className="text-emerald-400 inline-flex items-center gap-1">Share <Share className="w-3 h-3 inline" /></strong> button in Safari's bottom toolbar.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-[var(--bg-sunofy)] p-2.5 rounded-xl border border-[var(--border-sunofy)]">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                <p className="text-[11px] leading-relaxed">
                  Scroll down and select <strong className="text-emerald-400 inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3 h-3 inline" /></strong>.
                </p>
              </div>

              <div className="flex items-start gap-2.5 bg-[var(--bg-sunofy)] p-2.5 rounded-xl border border-[var(--border-sunofy)]">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                <p className="text-[11px] leading-relaxed">
                  Tap <strong className="text-emerald-400">Add</strong> at top right to launch Sunofy from your home screen!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[var(--accent-sunofy)] text-[var(--bg-sunofy)] font-black text-xs transition cursor-pointer"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
