import { setCssVar } from 'quasar';

/**
 * Quasar brand tokens shared by the app shell and public site entry points.
 *
 * Mapped to the app theme palette defined in tokens.css.
 * Keep in sync with PWA / manifest theme colors where applicable.
 */
export const APP_QUASAR_CSS_VARS: Record<string, string> = {
    primary: 'hsla(358, 84%, 52%, 1)',   /* --racing-red */
    secondary: 'hsla(226, 97%, 12%, 1)', /* --deep-navy */
    accent: 'hsla(255, 2%, 62%, 1)',     /* --rosy-granite */
    positive: 'hsla(195, 89%, 28%, 1)',  /* --cerulean */
    warning: 'hsla(54, 100%, 73%, 1)',   /* --banana-cream */
};

/**
 * Applies Quasar CSS variables for the application palette.
 */
export function applyAppQuasarTheme() {
    for (const [name, value] of Object.entries(APP_QUASAR_CSS_VARS)) {
        setCssVar(name, value);
    }
}
