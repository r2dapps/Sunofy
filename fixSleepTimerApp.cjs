const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(
  'const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);',
  'const [sleepTimerTarget, setSleepTimerTarget] = useState<number | null>(null);'
);

const oldSleepTimerLogic = /  \/\/ Sleep Timer Handler[\s\S]*?\}, \[sleepTimerMinutes\]\);/g;
const newSleepTimerLogic = `  // Sleep Timer Handler (Absolute Timestamp to survive background throttling)
  useEffect(() => {
    if (sleepTimerTimeoutRef.current) clearInterval(sleepTimerTimeoutRef.current);
    if (sleepTimerTarget !== null) {
      sleepTimerTimeoutRef.current = setInterval(() => {
        if (Date.now() >= sleepTimerTarget) {
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            showToast('Sleep timer expired. Playback paused.');
          }
          setSleepTimerTarget(null);
        }
      }, 5000);
    }
  }, [sleepTimerTarget]);`;

content = content.replace(oldSleepTimerLogic, newSleepTimerLogic);

content = content.replace('activeMinutes={sleepTimerMinutes}', 'activeTargetTime={sleepTimerTarget}');
content = content.replace('onSetTimer={setSleepTimerMinutes}', 'onSetTimer={(minutes) => { if (minutes) { setSleepTimerTarget(Date.now() + minutes * 60000); showToast(`Sleep timer set for ${minutes} minutes`); } else { setSleepTimerTarget(null); } }}');

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx sleep timer updated');
