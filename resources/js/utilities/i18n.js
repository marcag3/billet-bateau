import { createI18n } from 'vue-i18n';

export const LOCALE_STORAGE_KEY = 'app.locale';
export const SUPPORTED_LOCALES = ['en', 'fr'];
export const DEFAULT_LOCALE = 'en';

const messages = {
    en: {
        common: {
            appWorkspace: 'Application Workspace',
            publicExperience: 'Public Experience',
            dashboard: 'Dashboard',
            reports: 'Reports',
            settings: 'Settings',
            newProgram: 'New program',
            logout: 'Logout',
            reauthenticate: 'Reauthenticate',
            openApp: 'Open App',
            language: 'Language',
            welcome: 'Welcome',
            dismiss: 'Dismiss',
        },
        auth: {
            signIn: 'Sign in',
            authenticateWorkspace: 'Authenticate to access your workspace.',
            email: 'Email',
            password: 'Password',
            rememberMe: 'Remember me',
            emailPasswordRequired: 'Email and password are required.',
            unableAuthenticate: 'Unable to authenticate. Please try again.',
            sessionExpiredAfterReconnect: 'Your session expired after reconnect. Please authenticate again.',
            sessionExpired: 'Your session expired. Please sign in again.',
            pleaseSignInContinue: 'Please sign in to continue.',
            unableSetupStatus: 'Unable to determine setup status.',
            unableInitCsrf: 'Unable to initialize CSRF protection.',
            unableVerifySession: 'Unable to verify the current session.',
            unableSignInCreds: 'Unable to sign in with the provided credentials.',
            unableCompleteSetup: 'Unable to complete setup.',
        },
        setup: {
            title: 'First-time setup',
            subtitle: 'Create your first administrator account.',
            organizationName: 'Organization name',
            adminEmail: 'Admin email',
            confirmPassword: 'Confirm password',
            completeSetup: 'Complete setup',
            requiredFields: 'Organization name, email, and password are required.',
            passwordMismatch: 'Password confirmation does not match.',
        },
        dashboard: {
            title: 'Dashboard',
            syncedDescription: 'Local todos are synced through PowerSync and TanStack DB.',
            newTodo: 'New todo',
            newTodoPlaceholder: 'Write next task...',
            add: 'Add',
            loadingTodos: 'Loading todos...',
            noSyncedTodos: 'No synced todos yet.',
            updated: 'Updated {timestamp}',
            justNow: 'just now',
            recently: 'recently',
        },
        reports: {
            title: 'Reports',
            lazyDescription: 'This route is lazy-loaded to keep startup payload lower.',
        },
        settings: {
            title: 'Settings',
            isolatedDescription: 'Feature-specific settings remain isolated to the app bundle.',
        },
        programsCreate: {
            title: 'Create program',
            subtitle: 'Program details sync through PowerSync; images upload to the server and sync as metadata.',
            name: 'Name',
            description: 'Description',
            themeColor: 'Theme color',
            addressOptional: 'Address (optional)',
            line1: 'Address line 1',
            line2: 'Address line 2',
            city: 'City',
            postalCode: 'Postal code',
            country: 'Country',
            images: 'Images',
            submit: 'Create program',
            success: 'Program created.',
            validationRequired: 'This field is required.',
            validationHex: 'Use a hex color like #RRGGBB.',
        },
        sync: {
            syncRequestFailed: 'Sync request failed.',
            unableLoadTodoSync: 'Unable to load todo sync.',
            persistenceLimited:
                'Browser storage (OPFS/SQLite) is unavailable. Todos work online only until you use a supported browser.',
            outboxTitle: 'Pending sync',
            outboxEmpty: 'No pending writes.',
            rowPendingSync: 'Pending server sync',
            outboxCommitFailed:
                'Could not sync a pending change to the server yet. Your edit is still queued locally; you can try again.',
        },
        legacyDashboard: {
            featureRichDescription:
                'This application bundle is intentionally feature-rich and can grow independently from the public site.',
            operationsTitle: 'Operations',
            operationsSubtitle: 'Manage crossings, boats, and capacity.',
            analyticsTitle: 'Analytics',
            analyticsSubtitle: 'Track bookings and conversion trends.',
            openReports: 'Open reports',
        },
        legacyReports: {
            startupDescription: 'This page is lazy-loaded to keep initial app startup responsive.',
            line: 'Line',
            bookings: 'Bookings',
            fillRate: 'Fill rate',
            morningFerry: 'Morning ferry',
            afternoonFerry: 'Afternoon ferry',
            eveningFerry: 'Evening ferry',
        },
        public: {
            minimalDescription:
                'This public bundle stays minimal and avoids loading the feature-rich app modules.',
        },
        locale: {
            english: 'English',
            french: 'French',
        },
    },
    fr: {
        common: {
            appWorkspace: "Espace de l'application",
            publicExperience: 'Experience publique',
            dashboard: 'Tableau de bord',
            reports: 'Rapports',
            settings: 'Parametres',
            newProgram: 'Nouveau programme',
            logout: 'Se deconnecter',
            reauthenticate: "Se reconnecter",
            openApp: "Ouvrir l'application",
            language: 'Langue',
            welcome: 'Bienvenue',
            dismiss: 'Fermer',
        },
        auth: {
            signIn: 'Se connecter',
            authenticateWorkspace: 'Authentifiez-vous pour acceder a votre espace de travail.',
            email: 'E-mail',
            password: 'Mot de passe',
            rememberMe: 'Se souvenir de moi',
            emailPasswordRequired: "L'e-mail et le mot de passe sont requis.",
            unableAuthenticate: "Impossible de s'authentifier. Veuillez reessayer.",
            sessionExpiredAfterReconnect:
                'Votre session a expire apres la reconnexion. Veuillez vous authentifier de nouveau.',
            sessionExpired: 'Votre session a expire. Veuillez vous reconnecter.',
            pleaseSignInContinue: 'Veuillez vous connecter pour continuer.',
            unableSetupStatus: "Impossible de determiner l'etat de configuration.",
            unableInitCsrf: 'Impossible de lancer la protection CSRF.',
            unableVerifySession: 'Impossible de verifier la session en cours.',
            unableSignInCreds: "Impossible de se connecter avec les identifiants fournis.",
            unableCompleteSetup: 'Impossible de terminer la configuration.',
        },
        setup: {
            title: 'Configuration initiale',
            subtitle: 'Creez votre premier compte administrateur.',
            organizationName: "Nom de l'organisation",
            adminEmail: "E-mail administrateur",
            confirmPassword: 'Confirmer le mot de passe',
            completeSetup: 'Terminer la configuration',
            requiredFields: "Le nom de l'organisation, l'e-mail et le mot de passe sont requis.",
            passwordMismatch: 'La confirmation du mot de passe ne correspond pas.',
        },
        dashboard: {
            title: 'Tableau de bord',
            syncedDescription: 'Les taches locales sont synchronisees via PowerSync et TanStack DB.',
            newTodo: 'Nouvelle tache',
            newTodoPlaceholder: 'Ecrivez la prochaine tache...',
            add: 'Ajouter',
            loadingTodos: 'Chargement des taches...',
            noSyncedTodos: 'Aucune tache synchronisee pour le moment.',
            updated: 'Mise a jour {timestamp}',
            justNow: "a l'instant",
            recently: 'recemment',
        },
        reports: {
            title: 'Rapports',
            lazyDescription: 'Cette route est chargee a la demande pour reduire le chargement initial.',
        },
        settings: {
            title: 'Parametres',
            isolatedDescription:
                "Les parametres specifiques restent isoles dans le bundle de l'application.",
        },
        programsCreate: {
            title: 'Creer un programme',
            subtitle:
                'Les details de programme sont synchronises via PowerSync ; les images sont envoyees au serveur puis leurs metadonnees sont synchronisees.',
            name: 'Nom',
            description: 'Description',
            themeColor: 'Couleur du theme',
            addressOptional: 'Adresse (optionnelle)',
            line1: 'Ligne 1',
            line2: 'Ligne 2',
            city: 'Ville',
            postalCode: 'Code postal',
            country: 'Pays',
            images: 'Images',
            submit: 'Creer le programme',
            success: 'Programme cree.',
            validationRequired: 'Ce champ est requis.',
            validationHex: 'Utilisez une couleur hexadecimale #RRGGBB.',
        },
        sync: {
            syncRequestFailed: 'La requete de synchronisation a echoue.',
            unableLoadTodoSync: 'Impossible de charger la synchronisation des taches.',
            persistenceLimited:
                "Le stockage du navigateur (OPFS/SQLite) n'est pas disponible. Les taches ne fonctionnent qu'en ligne avec ce navigateur.",
            outboxTitle: 'Synchronisation en attente',
            outboxEmpty: 'Aucune ecriture en attente.',
            rowPendingSync: 'En attente du serveur',
            outboxCommitFailed:
                "La synchronisation d'une modification vers le serveur a echoue pour le moment. Votre modification reste en file localement ; vous pouvez reessayer.",
        },
        legacyDashboard: {
            featureRichDescription:
                "Ce bundle applicatif est volontairement riche en fonctionnalites et peut evoluer independamment du site public.",
            operationsTitle: 'Operations',
            operationsSubtitle: 'Gerez les traverses, les bateaux et la capacite.',
            analyticsTitle: 'Analytique',
            analyticsSubtitle: 'Suivez les reservations et les tendances de conversion.',
            openReports: 'Ouvrir les rapports',
        },
        legacyReports: {
            startupDescription:
                "Cette page est chargee a la demande pour conserver un demarrage initial reactif.",
            line: 'Ligne',
            bookings: 'Reservations',
            fillRate: 'Taux de remplissage',
            morningFerry: 'Ferry du matin',
            afternoonFerry: "Ferry de l'apres-midi",
            eveningFerry: 'Ferry du soir',
        },
        public: {
            minimalDescription:
                "Ce bundle public reste minimal et evite de charger les modules riches de l'application.",
        },
        locale: {
            english: 'Anglais',
            french: 'Francais',
        },
    },
};

function normalizeLocale(value) {
    if (typeof value !== 'string' || value.length === 0) {
        return DEFAULT_LOCALE;
    }

    const baseLocale = value.toLowerCase().split('-')[0];

    return SUPPORTED_LOCALES.includes(baseLocale) ? baseLocale : DEFAULT_LOCALE;
}

function resolveInitialLocale() {
    if (typeof window === 'undefined') {
        return DEFAULT_LOCALE;
    }

    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);

    if (storedLocale) {
        return normalizeLocale(storedLocale);
    }

    return normalizeLocale(window.navigator.language);
}

export const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: resolveInitialLocale(),
    fallbackLocale: DEFAULT_LOCALE,
    messages,
});

export function setLocale(locale) {
    const nextLocale = normalizeLocale(locale);
    i18n.global.locale.value = nextLocale;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
}

export function translate(key, values = {}) {
    return i18n.global.t(key, values);
}
