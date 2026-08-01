import React, { useState, useEffect, useRef } from 'react';
import { X, SlidersHorizontal, RotateCcw, Save, Trash2, Plus, Volume2, Headphones, Settings, Zap } from 'lucide-react';
import { EqualizerBand } from '../types';

interface CustomPreset {
  name: string;
  gains: number[];
}

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bands: EqualizerBand[];
  onBandChange: (index: number, gain: number) => void;
  onReset: () => void;
  onApplyPreset: (presetName: string) => void;
  
  // New props for expanded options
  preamp: number;
  onPreampChange: (gain: number) => void;
  bassBoost: number;
  onBassBoostChange: (gain: number) => void;
  spatialBalance: number;
  onSpatialBalanceChange: (balance: number) => void;
  reverbPreset: string;
  onReverbPresetChange: (preset: string) => void;
  analyser: AnalyserNode | null;
  onApplyCustomGains: (gains: number[]) => void;
  
  reverbDelay: number;
  onReverbDelayChange: (value: number) => void;
  reverbFeedback: number;
  onReverbFeedbackChange: (value: number) => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({
  isOpen,
  onClose,
  bands,
  onBandChange,
  onReset,
  onApplyPreset,
  preamp,
  onPreampChange,
  bassBoost,
  onBassBoostChange,
  spatialBalance,
  onSpatialBalanceChange,
  reverbPreset,
  onReverbPresetChange,
  analyser,
  onApplyCustomGains,
  reverbDelay,
  onReverbDelayChange,
  reverbFeedback,
  onReverbFeedbackChange,
}) => {
  const [selectedPreset, setSelectedPreset] = useState('Flat');
  const [customPresetName, setCustomPresetName] = useState('');
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => {
    const saved = localStorage.getItem('sunofy_custom_eq_presets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Default genre presets (matching 10-bands)
  const defaultPresets = [
    'Flat',
    'Bass Boost',
    'Treble Boost',
    'Vocal',
    'Electronic',
    'Pop',
    'Rock',
    'Jazz',
    'Classical',
    'Hip Hop',
    'Dance',
    'Acoustic',
  ];

  const reverbSpaces = [
    'None',
    'Studio (Warm)',
    'Concert Hall',
    'Acoustic Arena',
    'Cosmic Echo',
    'Custom',
  ];

  // Visualizer drawing loop
  useEffect(() => {
    if (!isOpen || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      // Semi-transparent background for a smooth trail effect
      ctx.fillStyle = 'rgba(15, 15, 15, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.0;
      let barHeight;
      let x = 0;

      // Draw subtle background grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 20; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.95;

        // Custom premium neon visualizer bars
        const hue = (i / bufferLength) * 120 + 200; // beautiful gradient from cyan to electric purple
        ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.85)`;
        
        // Rounded top bars
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, analyser]);

  if (!isOpen) return null;

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    onApplyPreset(preset);
  };

  const handleCustomPresetClick = (preset: CustomPreset) => {
    setSelectedPreset(preset.name);
    onApplyCustomGains(preset.gains);
  };

  const handleSaveCustomPreset = () => {
    if (!customPresetName.trim()) return;
    
    const currentGains = bands.map((b) => b.gain);
    const newPreset: CustomPreset = {
      name: customPresetName.trim(),
      gains: currentGains,
    };

    const updated = [...customPresets.filter((p) => p.name !== newPreset.name), newPreset];
    setCustomPresets(updated);
    localStorage.setItem('sunofy_custom_eq_presets', JSON.stringify(updated));
    setSelectedPreset(newPreset.name);
    setCustomPresetName('');
  };

  const handleDeleteCustomPreset = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customPresets.filter((p) => p.name !== name);
    setCustomPresets(updated);
    localStorage.setItem('sunofy_custom_eq_presets', JSON.stringify(updated));
    if (selectedPreset === name) {
      setSelectedPreset('Flat');
      onApplyPreset('Flat');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade overflow-y-auto">
      <div className="bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-3xl w-full max-w-xl p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-sunofy)] pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--accent-sunofy)]/10 border border-[var(--accent-sunofy)]/20">
              <SlidersHorizontal className="w-5 h-5 text-[var(--accent-sunofy)] animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--text-sunofy)] tracking-tight">Audio Studio & FX</h3>
              <p className="text-[10px] font-medium text-[var(--muted-sunofy)] uppercase tracking-wider">10-Band Graphic Equalizer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Spectrum Visualizer */}
        <div className="relative bg-[#0d0d0d] border border-[var(--border-sunofy)] rounded-2xl overflow-hidden shadow-inner h-20 flex flex-col justify-end">
          {analyser ? (
            <canvas
              ref={canvasRef}
              width={400}
              height={80}
              className="w-full h-full block"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[var(--muted-sunofy)] gap-2">
              <Headphones className="w-4 h-4 text-[var(--accent-sunofy)]" />
              <span>Play music to activate real-time audio visualizer</span>
            </div>
          )}
          {analyser && (
            <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[9px] font-black tracking-widest text-[var(--accent-sunofy)] uppercase bg-black/60 border border-[var(--accent-sunofy)]/20 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-sunofy)] animate-ping" />
              Live Spectrum
            </div>
          )}
        </div>

        {/* Dynamic Preset Selector Pills */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--muted-sunofy)] uppercase tracking-wider">Presets Library</label>
          <div className="flex overflow-x-auto space-x-2 pb-1.5 no-scrollbar">
            {/* Genre Defaults */}
            {defaultPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  selectedPreset === preset
                    ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-black scale-102 border border-[var(--accent-sunofy)]'
                    : 'bg-[var(--bg-sunofy)] text-[var(--muted-sunofy)] border border-[var(--border-sunofy)] hover:text-[var(--text-sunofy)] hover:border-[var(--text-sunofy)]/30'
                }`}
              >
                {preset}
              </button>
            ))}
            
            {/* Custom Presets */}
            {customPresets.map((preset) => (
              <div
                key={preset.name}
                onClick={() => handleCustomPresetClick(preset)}
                className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                  selectedPreset === preset.name
                    ? 'bg-[var(--accent-sunofy)] text-black shadow-md font-black scale-102 border-[var(--accent-sunofy)]'
                    : 'bg-[var(--bg-sunofy)] text-[var(--muted-sunofy)] border-[var(--border-sunofy)] hover:text-[var(--text-sunofy)] hover:border-[var(--text-sunofy)]/30'
                }`}
              >
                <span>{preset.name}</span>
                <button
                  onClick={(e) => handleDeleteCustomPreset(preset.name, e)}
                  className="ml-1 p-0.5 rounded-full hover:bg-black/20 text-red-500 transition cursor-pointer"
                  title="Delete Custom Preset"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 10-Band Graphic EQ Sliders (Scrollable row) */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-[var(--muted-sunofy)] uppercase tracking-wider">Frequency Console</label>
          <div className="relative bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] p-4 rounded-2xl">
            {/* Horizontal Guide Lines */}
            <div className="absolute inset-x-0 inset-y-12 flex flex-col justify-between pointer-events-none opacity-20 px-4">
              <div className="border-t border-dashed border-[var(--text-sunofy)] w-full text-[8px] text-[var(--muted-sunofy)] text-right pr-2 font-mono">+12dB</div>
              <div className="border-t border-dashed border-[var(--accent-sunofy)] w-full text-[8px] text-[var(--accent-sunofy)] text-right pr-2 font-mono">0dB</div>
              <div className="border-t border-dashed border-[var(--text-sunofy)] w-full text-[8px] text-[var(--muted-sunofy)] text-right pr-2 font-mono">-12dB</div>
            </div>

            {/* Vertical Sliders */}
            <div className="flex justify-between items-end h-48 overflow-x-auto no-scrollbar gap-2.5 pt-4 relative z-10">
              {bands.map((band, idx) => {
                const fillPct = Math.round(((band.gain + 12) / 24) * 100);
                return (
                  <div key={band.freq} className="flex flex-col items-center h-full justify-between min-w-[42px] flex-1 select-none">
                    {/* Gain Indicator */}
                    <span className="text-[10px] text-[var(--accent-sunofy)] font-black font-mono">
                      {band.gain > 0 ? `+${band.gain}` : band.gain}
                    </span>
                    
                    {/* Custom Pointer-Tracking Smooth Scrubber */}
                    <div
                      className="relative h-28 w-5.5 bg-[var(--card-sunofy)] rounded-full flex items-end justify-center cursor-pointer overflow-hidden p-1 touch-none select-none border border-[var(--border-sunofy)] hover:border-[var(--accent-sunofy)]/50 transition-colors shadow-inner"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        const target = e.currentTarget;
                        const rect = target.getBoundingClientRect();
                        const updateGain = (clientY: number) => {
                          const relativeY = rect.bottom - clientY;
                          const ratio = Math.max(0, Math.min(1, relativeY / rect.height));
                          const newGain = Math.round(ratio * 24 - 12);
                          onBandChange(idx, newGain);
                        };
                        updateGain(e.clientY);

                        const handleMove = (moveEv: PointerEvent) => {
                          updateGain(moveEv.clientY);
                        };
                        const handleUp = () => {
                          window.removeEventListener('pointermove', handleMove);
                          window.removeEventListener('pointerup', handleUp);
                        };
                        window.addEventListener('pointermove', handleMove);
                        window.addEventListener('pointerup', handleUp);
                      }}
                    >
                      {/* Active Accent Color Filled Track Bar */}
                      <div
                        className="w-full bg-[var(--accent-sunofy)] rounded-full transition-all duration-75 shadow-[0_0_8px_rgba(29,185,84,0.6)]"
                        style={{ height: `${fillPct}%` }}
                      />
                      {/* White Slider Knob */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-[var(--accent-sunofy)] rounded-full shadow-md pointer-events-none"
                        style={{ bottom: `calc(${Math.max(4, Math.min(96, fillPct))}% - 8px)` }}
                      />
                    </div>
                    
                    {/* Freq Label */}
                    <span className="text-[10px] text-[var(--text-sunofy)] font-bold tracking-tight">{band.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Custom Preset Creator & Fine-Tuning Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Left Column: Custom Preset Creator */}
          <div className="p-4 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Save className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" />
                <span className="text-[10px] font-black text-[var(--text-sunofy)] uppercase tracking-wider">Save Current Profile</span>
              </div>
              <p className="text-[10px] text-[var(--muted-sunofy)] leading-relaxed">Commit your active EQ slider configurations to save as a custom preset.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Preset Name (e.g., Chill)"
                value={customPresetName}
                onChange={(e) => setCustomPresetName(e.target.value)}
                maxLength={15}
                className="flex-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-sunofy)] placeholder-[var(--muted-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
              />
              <button
                onClick={handleSaveCustomPreset}
                disabled={!customPresetName.trim()}
                className="p-2.5 rounded-xl bg-[var(--accent-sunofy)] text-black disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-md flex items-center justify-center"
                title="Save Custom Preset"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>

          {/* Right Column: Auxiliary Sound Effects */}
          <div className="p-4 bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] rounded-2xl space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-[var(--accent-sunofy)]" />
              <span className="text-[10px] font-black text-[var(--text-sunofy)] uppercase tracking-wider">Studio Audio Effects</span>
            </div>

            <div className="space-y-3.5 text-xs font-semibold text-[var(--text-sunofy)]">
              {/* Preamp Volume */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-[70px]">
                  <Volume2 className="w-3.5 h-3.5 text-[var(--muted-sunofy)]" />
                  <span>Preamp</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={preamp}
                  onChange={(e) => onPreampChange(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent-sunofy)] cursor-pointer h-1"
                />
                <span className="text-[10px] font-mono text-[var(--accent-sunofy)] min-w-[32px] text-right">
                  {preamp > 0 ? `+${preamp}` : preamp}dB
                </span>
              </div>

              {/* Super Bass Booster */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-[70px]">
                  <Settings className="w-3.5 h-3.5 text-[var(--muted-sunofy)]" />
                  <span>Bass Boost</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="12"
                  step="1"
                  value={bassBoost}
                  onChange={(e) => onBassBoostChange(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent-sunofy)] cursor-pointer h-1"
                />
                <span className="text-[10px] font-mono text-[var(--accent-sunofy)] min-w-[32px] text-right">
                  +{bassBoost}dB
                </span>
              </div>

              {/* Stereo spatial Balance */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 min-w-[70px]">
                  <Headphones className="w-3.5 h-3.5 text-[var(--muted-sunofy)]" />
                  <span>Pan Balance</span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.1"
                  value={spatialBalance}
                  onChange={(e) => onSpatialBalanceChange(Number(e.target.value))}
                  className="flex-1 accent-[var(--accent-sunofy)] cursor-pointer h-1"
                />
                <span className="text-[10px] font-mono text-[var(--accent-sunofy)] min-w-[32px] text-right">
                  {spatialBalance === 0 ? 'Center' : spatialBalance > 0 ? `R ${Math.round(spatialBalance * 10)}` : `L ${Math.round(Math.abs(spatialBalance) * 10)}`}
                </span>
              </div>

              {/* Ambient Reverb Spaces */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="min-w-[70px]">Ambient FX</span>
                <select
                  value={reverbPreset}
                  onChange={(e) => onReverbPresetChange(e.target.value)}
                  className="flex-1 bg-[var(--card-sunofy)] border border-[var(--border-sunofy)] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--text-sunofy)] focus:outline-none focus:border-[var(--accent-sunofy)]"
                >
                  {reverbSpaces.map((space) => (
                    <option key={space} value={space}>
                      {space}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Reverb Controls */}
              {reverbPreset === 'Custom' && (
                <div className="space-y-2.5 pl-3 border-l-2 border-[var(--accent-sunofy)]/30 animate-fade pt-1">
                  {/* Reverb Delay Time */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-[var(--muted-sunofy)] min-w-[70px]">Room Size</span>
                    <input
                      type="range"
                      min="0.05"
                      max="1.0"
                      step="0.05"
                      value={reverbDelay}
                      onChange={(e) => onReverbDelayChange(Number(e.target.value))}
                      className="flex-1 accent-[var(--accent-sunofy)] cursor-pointer h-1"
                    />
                    <span className="text-[10px] font-mono text-[var(--accent-sunofy)] min-w-[32px] text-right">
                      {Math.round(reverbDelay * 1000)}ms
                    </span>
                  </div>

                  {/* Reverb Feedback / Decay */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] text-[var(--muted-sunofy)] min-w-[70px]">Decay Tail</span>
                    <input
                      type="range"
                      min="0.0"
                      max="0.9"
                      step="0.05"
                      value={reverbFeedback}
                      onChange={(e) => onReverbFeedbackChange(Number(e.target.value))}
                      className="flex-1 accent-[var(--accent-sunofy)] cursor-pointer h-1"
                    />
                    <span className="text-[10px] font-mono text-[var(--accent-sunofy)] min-w-[32px] text-right">
                      {Math.round(reverbFeedback * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--border-sunofy)]">
          <button
            onClick={onReset}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-[var(--bg-sunofy)] border border-[var(--border-sunofy)] text-xs font-extrabold text-[var(--muted-sunofy)] hover:text-[var(--text-sunofy)] hover:border-[var(--text-sunofy)]/30 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Audio FX</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[var(--accent-sunofy)] hover:bg-[var(--accent-sunofy)]/90 text-black text-xs font-black shadow-md cursor-pointer transition transform active:scale-95"
          >
            Save & Exit
          </button>
        </div>

      </div>
    </div>
  );
};
