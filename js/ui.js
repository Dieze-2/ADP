/**
 * Notifications non bloquantes (toasts), en bas à droite.
 * Remplacent alert()/confirm() pour les retours d'action ; action optionnelle (« Annuler »).
 */

function showToast(message, options = {}) {
    const { actionLabel, onAction, duration = 4000, tone = 'neutral' } = options;

    let region = document.getElementById('toastRegion');
    if (!region) {
        region = document.createElement('div');
        region.id = 'toastRegion';
        region.className = 'toast-region';
        region.setAttribute('role', 'status');
        region.setAttribute('aria-live', 'polite');
        document.body.appendChild(region);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${tone}`;

    const text = document.createElement('span');
    text.className = 'toast__text';
    text.textContent = message;
    toast.appendChild(text);

    let timer = null;
    const dismiss = () => {
        clearTimeout(timer);
        if (!toast.isConnected || toast.classList.contains('is-leaving')) return;
        toast.classList.add('is-leaving');
        setTimeout(() => toast.remove(), 200);
    };

    if (actionLabel && typeof onAction === 'function') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'toast__action';
        button.textContent = actionLabel;
        button.addEventListener('click', () => {
            dismiss();
            onAction();
        });
        toast.appendChild(button);
    }

    region.appendChild(toast);
    timer = setTimeout(dismiss, duration);
    return { dismiss };
}

window.showToast = showToast;
