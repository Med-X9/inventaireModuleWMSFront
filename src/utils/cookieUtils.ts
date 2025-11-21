import Cookies from 'js-cookie';

interface Tokens {
    access: string | null;
    refresh: string | null;
}

const TOKENS_COOKIE_NAME = 'app_tokens';

// Vite fournit ces booleans selon le mode
const IS_PROD = import.meta.env.PROD;

export function saveTokens(tokens: Tokens): void {
    const tokensString = JSON.stringify(tokens);
    Cookies.set(TOKENS_COOKIE_NAME, tokensString, {
        // ⚠️ Important : secure uniquement en production (HTTPS)
        secure: IS_PROD,
        sameSite: 'strict',
        // Durée de vie raisonnable (14 jours)
        expires: 14,
    });
}

export function getTokens(): Tokens | null {
    const tokensString = Cookies.get(TOKENS_COOKIE_NAME);

    if (tokensString) {
        try {
            return JSON.parse(tokensString) as Tokens;
        } catch (e) {
            // Invalid JSON in cookie, clear it
            clearTokens();
            return null;
        }
    }
    return null;
}

export function updateAccessToken(newAccessToken: string): void {
    const tokens = getTokens();
    if (tokens) {
        tokens.access = newAccessToken;
        saveTokens(tokens);
    }
}

export function clearTokens(): void {
    Cookies.remove(TOKENS_COOKIE_NAME);
}