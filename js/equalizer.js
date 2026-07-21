// EQUALIZER & BASS BOOST AUDIO ENGINE MODULE
let audioCtx = null;
let sourceNode = null;
let eqFilters = [];
let bassFilter = null;

const EQ_FREQUENCIES = [60, 230, 910, 4000, 14000];
const EQ_PRESETS = {
    flat: [0, 0, 0, 0, 0],
    bass: [8, 6, 2, 0, -2],
    vocal: [-2, 2, 6, 4, 1],
    pop: [2, 4, 5, 3, 1],
    acoustic: [4, 3, 2, 4, 5],
    rock: [6, 4, -1, 3, 6]
};

function initAudioEqualizerEngine(audioElement) {
    if (audioCtx) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        sourceNode = audioCtx.createMediaElementSource(audioElement);

        // Create 5 peaking filters
        eqFilters = EQ_FREQUENCIES.map((freq, idx) => {
            const filter = audioCtx.createBiquadFilter();
            filter.type = idx === 0 ? 'lowshelf' : (idx === 4 ? 'highshelf' : 'peaking');
            filter.frequency.value = freq;
            filter.gain.value = 0;
            return filter;
        });

        // Create Bass Boost filter
        bassFilter = audioCtx.createBiquadFilter();
        bassFilter.type = 'lowshelf';
        bassFilter.frequency.value = 100;
        bassFilter.gain.value = 0;

        // Chain nodes: source -> eq[0] -> eq[1] -> ... -> bass -> destination
        let node = sourceNode;
        eqFilters.forEach(filter => {
            node.connect(filter);
            node = filter;
        });
        node.connect(bassFilter);
        bassFilter.connect(audioCtx.destination);
    } catch(e) {
        console.log('Web Audio Context already attached or restricted.');
    }
}

function setEqualizerGain(bandIdx, gainValue) {
    if (eqFilters[bandIdx]) {
        eqFilters[bandIdx].gain.value = gainValue;
    }
}

function setBassBoostGain(gainValue) {
    if (bassFilter) {
        bassFilter.gain.value = gainValue;
    }
}

function applyEqualizerPreset(presetName) {
    const values = EQ_PRESETS[presetName] || EQ_PRESETS.flat;
    values.forEach((val, i) => {
        setEqualizerGain(i, val);
        const slider = document.getElementById(`eq-band-${i}`);
        if (slider) slider.value = val;
    });
}

function setupEqualizerModalHandlers() {
    const openBtns = [document.getElementById('open-eq-btn'), document.getElementById('fs-eq-btn')];
    const modal = document.getElementById('equalizer-modal');
    const closeBtn = document.getElementById('close-eq-btn');
    const audioNode = document.getElementById('audio-node');

    openBtns.forEach(btn => {
        if (!btn) return;
        btn.onclick = (e) => {
            e.stopPropagation();
            if (audioNode) initAudioEqualizerEngine(audioNode);
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            if (modal) modal.classList.replace('hidden', 'flex');
        };
    });

    if (closeBtn && modal) {
        closeBtn.onclick = () => modal.classList.replace('flex', 'hidden');
    }

    // EQ Band Sliders
    EQ_FREQUENCIES.forEach((_, i) => {
        const slider = document.getElementById(`eq-band-${i}`);
        if (slider) {
            slider.addEventListener('input', (e) => {
                setEqualizerGain(i, parseFloat(e.target.value));
            });
        }
    });

    // Bass Boost Slider
    const bassSlider = document.getElementById('bass-boost-slider');
    if (bassSlider) {
        bassSlider.addEventListener('input', (e) => {
            setBassBoostGain(parseFloat(e.target.value));
        });
    }

    // Preset Buttons
    document.querySelectorAll('.eq-preset-btn').forEach(btn => {
        btn.onclick = () => {
            const preset = btn.getAttribute('data-preset');
            applyEqualizerPreset(preset);
            document.querySelectorAll('.eq-preset-btn').forEach(b => {
                b.className = "eq-preset-btn text-xs py-1.5 px-3 rounded-lg border border-app bg-app-body text-muted hover:text-main font-semibold transition-all cursor-pointer";
            });
            btn.className = "eq-preset-btn text-xs py-1.5 px-3 rounded-lg border border-accent/40 bg-accent/15 text-accent font-bold transition-all cursor-pointer";
        };
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEqualizerModalHandlers();
});
