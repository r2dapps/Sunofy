// LOCAL FOLDER MUSIC IMPORTER MODULE FOR SUNOFY
let _localFolderFiles = [];

async function openLocalMusicFolder() {
    try {
        if ('showDirectoryPicker' in window) {
            const dirHandle = await window.showDirectoryPicker();
            const tracks = [];

            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && isAudioFileName(entry.name)) {
                    const file = await entry.getFile();
                    tracks.push(createTrackObjFromFile(file));
                }
            }

            if (tracks.length > 0) {
                renderLocalFolderFeed(tracks, dirHandle.name);
                if (typeof showToastNotification === 'function') showToastNotification(`Loaded ${tracks.length} tracks from "${dirHandle.name}"`, 'success');
            } else {
                if (typeof showToastNotification === 'function') showToastNotification("No audio files found in directory.", 'error');
            }
        } else {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.webkitdirectory = true;
            fileInput.multiple = true;
            fileInput.accept = "audio/*";
            
            fileInput.onchange = async (e) => {
                const files = Array.from(e.target.files).filter(f => isAudioFileName(f.name));
                const tracks = files.map(createTrackObjFromFile);
                if (tracks.length > 0) {
                    renderLocalFolderFeed(tracks, "Local Music Folder");
                    if (typeof showToastNotification === 'function') showToastNotification(`Loaded ${tracks.length} local audio files`, 'success');
                } else {
                    if (typeof showToastNotification === 'function') showToastNotification("No audio files selected.", 'error');
                }
            };
            fileInput.click();
        }
    } catch (e) {
        if (e.name !== 'AbortError') {
            console.error("[LocalFolder] Importer error:", e);
        }
    }
}

function isAudioFileName(name) {
    const ext = name.split('.').pop().toLowerCase();
    return ['mp3', 'm4a', 'flac', 'wav', 'aac', 'ogg', 'opus'].includes(ext);
}

function createTrackObjFromFile(file) {
    const blobUrl = URL.createObjectURL(file);
    const rawName = file.name.replace(/\.[^/.]+$/, "");
    let title = rawName;
    let artist = "Local Music File";

    if (rawName.includes(" - ")) {
        const parts = rawName.split(" - ");
        title = parts[0].trim();
        artist = parts[1].trim();
    } else {
        title = rawName.replace(/_/g, " ");
    }

    return {
        id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: title,
        album: { name: "Local Disk Media" },
        primaryArtists: artist,
        audioUrl: blobUrl,
        downloadUrl: [{ quality: "Original", url: blobUrl }],
        image: [{ quality: "500x500", url: "images/icon-512.png" }],
        isLocalFile: true
    };
}

function renderLocalFolderFeed(tracks, folderName = "Local Directory") {
    AppState.localFolderTracks = tracks;
    const container = document.getElementById('search-output-list');
    const headerTitle = document.getElementById('search-view-title');
    
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="fa-solid fa-folder-open text-amber-400 mr-2"></i> ${folderName} (${tracks.length} tracks)`;
    }

    if (container && typeof renderSearchOutputsFeed === 'function') {
        renderSearchOutputsFeed(tracks);
    }

    // Switch to discover view to show loaded tracks
    if (typeof switchAppView === 'function') {
        switchAppView('discover');
    }
}
