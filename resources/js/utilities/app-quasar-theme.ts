import { setCssVar } from 'quasar';

/**
 * Quasar brand tokens shared by the app shell and public site entry points.
 * Keep in sync with PWA / manifest theme colors where applicable.
 */
export const APP_QUASAR_CSS_VARS = {
    primary: '#ea1d2c',
    secondary: '#00164d',
    accent: '#9ca3af',
    positive: '#0f766e',
    warning: '#b45309',
};

/**
 * Applies Quasar CSS variables for the application palette.
 */
export function applyAppQuasarTheme() {
    for (const [name, value] of Object.entries(APP_QUASAR_CSS_VARS)) {
        setCssVar(name, value);
    }
}
