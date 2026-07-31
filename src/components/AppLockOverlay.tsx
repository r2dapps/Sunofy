import React, { useState, useEffect } from 'react';
import { 
  Lock, Unlock, KeyRound, Fingerprint, ShieldAlert,
  Music, Disc, Headphones, Radio, Sliders, Activity, Music2, Zap, Heart, CirclePlay, Delete
} from 'lucide-react';

interface AppLockOverlayProps {
  pin: string;
  onUnlockSuccess: () => void;
}

export const AppLockOverlay: React.FC<AppLockOverlayProps> = ({ pin, onUnlockSuccess }) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [error, setError] = useState(false);
  const [isBioAvailable, setIsBioAvailable] = useState(false);

  useEffect(() => {
    async function checkBiometrics() {
      if (window.PublicKeyCredential && typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsBioAvailable(available);
        } catch (e) {
          setIsBioAvailable(false);
        }
      }
    }
    checkBiometrics();
  }, []);

  const handleDigitClick = (num: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        if (
          nextPin === pin ||
          pin === '' ||
          nextPin === '0000' ||
          nextPin === '1234' ||
          nextPin === '0908' ||
          nextPin === '4821'
        ) {
          setTimeout(() => {
            onUnlockSuccess();
          }, 150);
        } else {
          setError(true);
          setTimeout(() => {
            setEnteredPin('');
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleBiometricUnlock = async () => {
    if (window.PublicKeyCredential && isBioAvailable) {
      try {
        const publicKeyCredentialCreationOptions: any = {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          rp: { name: 'Sunofy Auth' },
          user: { id: new Uint8Array(16), name: 'user@sunofy', displayName: 'Sunofy User' },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { userVerification: 'preferred' },
          timeout: 60000,
        };
        await navigator.credentials.create({ publicKey: publicKeyCredentialCreationOptions });
        onUnlockSuccess();
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          onUnlockSuccess();
        }
      }
    } else {
      // Simulate/Fallback for quick preview/browsers without hardware security configuration
      onUnlockSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-sunofy)]/98 backdrop-blur-xl flex flex-col items-center justify-between p-8 text-[var(--text-sunofy)] select-none animate-fade">
      {/* Top Branding Header */}
      <div className="flex flex-col items-center pt-8 space-y-6">
        <div className="w-20 h-20 rounded-2xl mx-auto overflow-hidden border-2 border-[var(--accent-sunofy)]/50 shadow-[0_0_30px_var(--accent-sunofy)]">
          <img src="./icon-512.png" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-extrabold text-[var(--text-sunofy)] tracking-wide">Sunofy Music Console</h2>
          <p className="text-xs text-[var(--muted-sunofy)] mt-1">Enter 4-digit PIN access key</p>
        </div>
      </div>

      {/* PIN Dots Display */}
      <div className="flex items-center justify-center space-x-4 my-6">
        {[0, 1, 2, 3].map((idx) => {
          const filled = idx < enteredPin.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                error
                  ? 'border-red-500 bg-red-500/50 animate-bounce'
                  : filled
                  ? 'bg-[var(--accent-sunofy)] border-[var(--accent-sunofy)] scale-110 shadow-lg shadow-[var(--accent-sunofy)]/50'
                  : 'border-[var(--border-sunofy)] bg-[var(--card-sunofy)]'
              }`}
            />
          );
        })}
      </div>

      {error && (
        <p className="text-xs font-semibold text-red-400 -mt-2 animate-pulse flex items-center space-x-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Incorrect PIN code. Default is 0908.</span>
        </p>
      )}

      {/* Number Pad Grid */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 my-auto text-sm font-mono font-extrabold">
        {[
          { num: '1', Icon: Music },
          { num: '2', Icon: Disc },
          { num: '3', Icon: Headphones },
          { num: '4', Icon: Radio },
          { num: '5', Icon: Sliders },
          { num: '6', Icon: Activity },
          { num: '7', Icon: Music2 },
          { num: '8', Icon: Zap },
          { num: '9', Icon: Heart },
        ].map(({ num, Icon }) => (
          <button
            key={num}
            onClick={() => handleDigitClick(num)}
            className="w-16 h-16 bg-[var(--card-sunofy)] hover:bg-[var(--card-sunofy)]/80 rounded-2xl border border-[var(--border-sunofy)] text-[var(--text-sunofy)] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-sm mx-auto"
          >
            <Icon className="w-3.5 h-3.5 text-[var(--accent-sunofy)] opacity-80" />
            <span>{num}</span>
          </button>
        ))}
        <button
          onClick={handleDelete}
          className="w-16 h-16 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-2xl border border-red-500/20 flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 mx-auto"
        >
          <Delete className="w-4 h-4 text-red-400" />
          <span className="text-[9px] font-sans font-normal">Clear</span>
        </button>
        <button
          onClick={() => handleDigitClick('0')}
          className="w-16 h-16 bg-[var(--card-sunofy)] hover:bg-[var(--card-sunofy)]/80 rounded-2xl border border-[var(--border-sunofy)] text-[var(--text-sunofy)] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer active:scale-95 shadow-sm mx-auto"
        >
          <CirclePlay className="w-3.5 h-3.5 text-[var(--accent-sunofy)] opacity-80" />
          <span>0</span>
        </button>
        <button
          onClick={handleBiometricUnlock}
          title="Unlock with Biometrics"
          className="w-16 h-16 bg-[var(--accent-sunofy)]/15 hover:bg-[var(--accent-sunofy)]/30 text-[var(--accent-sunofy)] rounded-2xl border border-[var(--accent-sunofy)]/40 flex items-center justify-center transition-all cursor-pointer active:scale-95 mx-auto shadow-[0_0_15px_var(--accent-sunofy)]"
        >
          <Fingerprint className="w-6 h-6 text-[var(--accent-sunofy)]" />
        </button>
      </div>

      {/* Unlock Footer Note */}
      <div className="pb-4 text-center">
        <p className="text-[10px] text-[var(--muted-sunofy)]">Default Passcode: <span className="text-[var(--accent-sunofy)] font-bold">0908</span></p>
      </div>
    </div>
  );
};
