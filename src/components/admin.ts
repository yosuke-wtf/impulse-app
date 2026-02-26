


export function initAdmin(): void {
    _initVerification();
    _initAnnouncement();
}



function _initVerification(): void {
    const discordInput = document.getElementById('admin-discord-id') as HTMLInputElement;
    const verifyBtn = document.getElementById('admin-verify-btn');
    const authContainer = document.getElementById('admin-auth-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const authMsg = document.getElementById('admin-auth-msg');

    verifyBtn?.addEventListener('click', async () => {
        const discordId = discordInput?.value?.trim();
        if (!discordId) return;

        verifyBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifiziere…';
        (verifyBtn as HTMLButtonElement).disabled = true;

        try {
            const isVerified = await window.ipcRenderer.invoke('verify-admin', discordId);
            if (isVerified) {
                if (authContainer) authContainer.style.display = 'none';
                if (adminDashboard) adminDashboard.style.display = 'block';
            } else {
                if (authMsg) {
                    authMsg.style.display = 'block';
                    authMsg.style.color = 'var(--danger)';
                    authMsg.textContent = 'Zugriff verweigert: Discord-ID nicht in der Whitelist.';
                }
            }
        } catch (err) {
            console.error('[Admin] Verifizierungsfehler:', err);
        } finally {
            verifyBtn.innerHTML = 'Verify Access';
            (verifyBtn as HTMLButtonElement).disabled = false;
        }
    });
}

function _initAnnouncement(): void {
    const messageInput = document.getElementById('admin-announce-input') as HTMLInputElement;
    const authorInput = document.getElementById('admin-announce-author') as HTMLInputElement;
    const announceBtn = document.getElementById('admin-announce-btn');
    const successMsg = document.getElementById('admin-announce-msg');

    announceBtn?.addEventListener('click', async () => {
        const text = messageInput?.value?.trim();
        const author = authorInput?.value?.trim() || 'Admin';
        if (!text) return;

        await window.ipcRenderer.invoke('post-announcement', { text, author });

        if (successMsg) {
            successMsg.style.display = 'block';
            setTimeout(() => { successMsg.style.display = 'none'; }, 3000);
        }
        messageInput.value = '';
    });
}
