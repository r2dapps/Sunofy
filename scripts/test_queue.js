const queue = [];

function addTrackToQueue(track) {
    const queueItem = { ...track, queueId: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` };
    queue.push(queueItem);
}

// Add two tracks
addTrackToQueue({ id: 'track1', title: 'Song 1' });
addTrackToQueue({ id: 'track2', title: 'Song 2' });

let currentTrack = queue[0];
let isPlaying = true;

function nextTrackInQueue() {
    if (queue.length === 0) {
      currentTrack = null;
      isPlaying = false;
      return;
    }

    const currentIndex = currentTrack
      ? queue.findIndex((t) => 
          t.queueId 
            ? t.queueId === currentTrack?.queueId 
            : (t.id === currentTrack?.id || t.title === currentTrack?.title)
        )
      : -1;

    console.log('Current track:', currentTrack);
    console.log('Current index:', currentIndex);

    if (currentIndex >= 0 && currentIndex < queue.length - 1) {
      currentTrack = queue[currentIndex + 1];
      isPlaying = true;
    } else if (queue.length > 0) {
      currentTrack = queue[0];
      isPlaying = true;
    } else {
      isPlaying = false;
    }
}

console.log('--- Initial State ---');
console.log('Queue:', queue);
console.log('Playing:', currentTrack);

console.log('\n--- Calling nextTrackInQueue (should go to index 1) ---');
nextTrackInQueue();
console.log('Playing:', currentTrack);

console.log('\n--- Calling nextTrackInQueue (should go to index 0) ---');
nextTrackInQueue();
console.log('Playing:', currentTrack);
