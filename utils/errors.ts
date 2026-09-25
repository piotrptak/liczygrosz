// Maps Supabase / network errors to translation keys.
export const errorKey = (error: unknown, fallback = 'save_failed'): string => {
    const e = error as { code?: string; message?: string; name?: string } | null;
    const code = e?.code ?? '';
    const message = e?.message ?? '';

    if (e?.name === 'TypeError' || e?.name === 'AuthRetryableFetchError' || /fetch|network/i.test(message)) return 'error_offline';
    if (/invalid login credentials/i.test(message)) return 'auth_invalid_credentials';
    if (/email not confirmed/i.test(message)) return 'auth_email_not_confirmed';
    switch (code) {
        case 'invalid_credentials': return 'auth_invalid_credentials';
        case 'email_not_confirmed': return 'auth_email_not_confirmed';
        case 'user_already_exists':
        case 'email_exists': return 'auth_user_exists';
        case 'weak_password': return 'auth_weak_password';
        case 'over_email_send_rate_limit':
        case 'over_request_rate_limit': return 'auth_rate_limit';
        case 'same_password': return 'auth_same_password';
        case '23505': return 'category_exists'; // unique violation
    }
    return fallback;
};
