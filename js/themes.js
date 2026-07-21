// THEME ENGINE MODULE
function initThemeEngine() {
    const savedTheme = localStorage.getItem('ok_theme') || 'dark';
    setAppTheme(savedTheme);
}

function setAppTheme(theme) {
    AppState.theme = theme;
    document.body.className = `bg-app-body text-main min-h-screen flex flex-col antialiased select-none overflow-x-hidden pb-16 md:pb-0 ${theme !== 'dark' ? 'theme-' + theme : ''}`;
    localStorage.setItem('ok_theme', theme);
}

function setupThemeSelectorHandlers() {
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            setAppTheme(theme);
        });
    });
}
