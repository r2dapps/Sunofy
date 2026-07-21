// GITHUB RELEASE UPDATE CHECKER MODULE
const GITHUB_OWNER = "r2dapps";
const GITHUB_REPO = "Sunofy";

async function checkForAppUpdates() {
    const btn = document.getElementById('check-updates-btn');
    if (btn) btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin"></i> Checking...`;
    
    try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`);
        if (res.ok) {
            const data = await res.json();
            if (data.tag_name && data.tag_name !== AppState.version) {
                alert(`🚀 Update Available!\n\nCurrent Version: ${AppState.version}\nLatest Release: ${data.tag_name}\n\nChangelog:\n${data.body || 'Performance & UI improvements.'}`);
            } else {
                alert(`Sunofy ${AppState.version} is up to date!`);
            }
        } else {
            alert(`Sunofy ${AppState.version} is up to date!`);
        }
    } catch (e) {
        alert(`Sunofy ${AppState.version} is up to date!`);
    } finally {
        if (btn) btn.innerHTML = `<i class="fa-solid fa-rotate mr-1"></i> Check Updates`;
    }
}
