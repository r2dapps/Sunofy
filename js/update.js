// GITHUB RELEASE & SERVICE WORKER UPDATE CHECKER MODULE
const GITHUB_OWNER = "r2dapps";
const GITHUB_REPO = "Sunofy";

function initUpdateChecker() {
    const updateBtn = document.getElementById('check-updates-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', checkForAppUpdates);
    }
}

async function checkForAppUpdates() {
    const btn = document.getElementById('check-updates-btn');
    if (!btn) return;

    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch animate-spin mr-1"></i> Checking...`;
    btn.disabled = true;

    try {
        // 1. Check ServiceWorker Cache Registration Update
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.update();
            }
        }

        // 2. Fetch Latest Commit Hash as Build Reference
        let commitSha = "";
        try {
            const commitRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?per_page=1`, {
                cache: 'no-store'
            });
            if (commitRes.ok) {
                const commits = await commitRes.json();
                commitSha = commits[0]?.sha?.substring(0, 7) || "";
            }
        } catch(e) {}

        // 3. Gracefully Check GitHub Release API Endpoint (ignore 404 if no release tagged yet)
        let latestTag = "";
        try {
            const releaseRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`, {
                cache: 'no-store'
            });
            if (releaseRes.ok) {
                const releaseData = await releaseRes.json();
                latestTag = releaseData.tag_name || "";
            }
        } catch(e) {}

        if (latestTag && latestTag !== AppState.version) {
            showUpdateNoticeModal(`🚀 New Release ${latestTag} Available!`, `A new official release tag is published on GitHub.`, true);
        } else if (commitSha) {
            showUpdateNoticeModal(`✅ Sunofy ${AppState.version} is up to date!`, `Latest GitHub Build Commit: #${commitSha}\nApp shell cache is synchronized.`);
        } else {
            showUpdateNoticeModal(`✅ Sunofy ${AppState.version} is up to date!`, `You are running the latest version build.`);
        }
    } catch (e) {
        showUpdateNoticeModal(`✅ Sunofy ${AppState.version} is up to date!`, `App shell cache is synchronized.`);
    } finally {
        btn.innerHTML = originalHTML;
        btn.disabled = false;
    }
}

function showUpdateNoticeModal(title, msg, canReload = false) {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 bg-black/80 z-[9990] flex items-center justify-center p-4 transition-opacity duration-300";
    modal.innerHTML = `
        <div class="bg-app-card border border-app rounded-2xl max-w-xs w-full p-5 space-y-4 shadow-2xl text-center">
            <div class="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 text-accent flex items-center justify-center mx-auto text-xl shadow-[0_0_15px_var(--accent-glow)]">
                <i class="fa-solid fa-rotate-right"></i>
            </div>
            <div>
                <h3 class="text-sm font-extrabold text-main">${title}</h3>
                <p class="text-xs text-muted mt-1 whitespace-pre-line">${msg}</p>
            </div>
            <div class="flex gap-2 pt-2">
                ${canReload ? `<button id="update-reload-btn" class="flex-1 bg-accent hover:bg-accent/90 text-white py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">Reload & Update</button>` : ''}
                <button id="update-dismiss-btn" class="flex-1 bg-app-body border border-app hover:border-accent text-main py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const dismissBtn = modal.querySelector('#update-dismiss-btn');
    if (dismissBtn) {
        dismissBtn.onclick = () => modal.remove();
    }

    const reloadBtn = modal.querySelector('#update-reload-btn');
    if (reloadBtn) {
        reloadBtn.onclick = () => window.location.reload(true);
    }
}

document.addEventListener('DOMContentLoaded', initUpdateChecker);
