// Bridge to the in-app FeedbackProvider (components/ui/Feedback.tsx).

type Handlers = {
    toast: (tone: 'success' | 'error' | 'info', title: string, message?: string) => void;
    confirm: (title: string, message: string, confirmLabel: string, cancelLabel: string) => Promise<boolean>;
};

let handlers: Handlers | null = null;

export const setFeedbackHandlers = (next: Handlers) => {
    handlers = next;
};

export const showMessage = (title: string, message?: string) => handlers?.toast('error', title, message);

export const showSuccess = (title: string, message?: string) => handlers?.toast('success', title, message);

export const confirmAction = (
    title: string,
    message: string,
    confirmText: string,
    cancelText: string,
    onConfirm: () => void
) => {
    handlers?.confirm(title, message, confirmText, cancelText).then(ok => {
        if (ok) onConfirm();
    });
};
