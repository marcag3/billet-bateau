import { createI18n } from 'vue-i18n';

export const LOCALE_STORAGE_KEY = 'app.locale';
export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = 'en';

const messages = {
    en: {
        common: {
            appWorkspace: 'Application Workspace',
            publicExperience: 'Public Experience',
            reports: 'Reports',
            settings: 'Settings',
            newProgram: 'New program',
            programs: 'Programs',
            boats: 'Boats',
            boatTypes: 'Boat types',
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
            validationRequired: 'This field is required.',
            validationEmail: 'Enter a valid email address.',
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
            validationRequired: 'This field is required.',
        },
        reports: {
            title: 'Reports',
            lazyDescription: 'This route is lazy-loaded to keep startup payload lower.',
        },
        settings: {
            title: 'Settings',
            isolatedDescription: 'Feature-specific settings remain isolated to the app bundle.',
        },
        programsEdit: {
            title: 'Edit program',
            subtitle:
                'Update details, URL slug, public visibility, and archive state. Changes sync through PowerSync; new images upload to the server.',
            submit: 'Save changes',
            success: 'Program updated.',
            notFound: 'This program could not be loaded. It may have been removed or you may not have access.',
            backToList: 'Back to programs',
            isArchived: 'Archived (hidden from Active tab)',
        },
        programsCreate: {
            title: 'Create program',
            subtitle: 'Program details sync through PowerSync; images upload to the server and sync as metadata.',
            formSection: 'Program details',
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
            unableLoadSync: 'Unable to load local sync.',
            persistenceLimited:
                'Browser storage (OPFS/SQLite) is unavailable. The workspace works online only until you use a supported browser.',
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
        publicLayout: {
            catalog: 'Catalog',
        },
        publicHome: {
            noPrograms: 'No programs are published yet.',
            loadError: 'Unable to load programs. Please try again later.',
        },
        publicProgram: {
            notFound: 'This program was not found.',
            backToCatalog: 'Back to catalog',
        },
        boatsList: {
            title: 'Boats',
            description: 'Create and edit boats locally; changes sync through PowerSync.',
            addNew: 'Add boat',
            name: 'Name',
            capacity: 'Capacity',
            capacityHint: 'Optional passenger capacity.',
            notes: 'Notes',
            boatType: 'Boat type',
            create: 'Create boat',
            empty: 'No boats yet. Add one above.',
            created: 'Boat saved.',
            deleted: 'Boat removed.',
            delete: 'Delete',
            deleteConfirmTitle: 'Delete boat?',
            deleteConfirmMessage: 'Remove "{name}"? This cannot be undone.',
            nameRequired: 'Name is required.',
            errorGeneric: 'Something went wrong. Please try again.',
            programRoster: 'Program roster',
            programRosterHint: 'Pick which program this boat list belongs to. Boats sync for that program only.',
            noProgramsForBoats: 'Create a program first, then choose it here to manage boats for that roster.',
        },
        boatTypesList: {
            title: 'Boat types',
            description: 'Define reusable boat categories. Images upload to the server and sync as metadata.',
            addNew: 'New boat type',
            name: 'Name',
            rename: 'Edit name',
            create: 'Create',
            images: 'Images',
            imagesUploaded: 'Images attached.',
            empty: 'No boat types yet. Create one above.',
            created: 'Boat type saved.',
            deleted: 'Boat type removed.',
            delete: 'Delete',
            deleteConfirmTitle: 'Delete boat type?',
            deleteConfirmMessage: 'Remove "{name}"? Boats using this type will keep their link cleared.',
            errorGeneric: 'Something went wrong. Please try again.',
        },
        programsList: {
            title: 'Programs',
            description:
                'Use Active and Archived tabs for your workspace. Turn on List on public site for catalog visibility, edit details and slug on the edit page, and copy a shareable URL.',
            empty: 'No programs yet. Create one with the button above.',
            emptyActive: 'No programs in the Active tab.',
            emptyArchived: 'No archived programs.',
            addProgram: 'New program',
            tabActive: 'Active',
            tabArchived: 'Archived',
            editProgram: 'Edit program',
            isActive: 'List on public site',
            slug: 'URL slug',
            slugHint: 'Lowercase, letters, numbers, and hyphens. The public page is /programs/your-slug. The server will adjust duplicates.',
            slugRequired: 'URL slug is required. Use a unique lowercase value.',
            copyUrl: 'Copy public link',
            copied: 'Link copied to clipboard',
            noDescription: 'No description',
            noAddress: 'No address on file',
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
            reports: 'Rapports',
            settings: 'Parametres',
            newProgram: 'Nouveau programme',
            programs: 'Programmes',
            boats: 'Bateaux',
            boatTypes: 'Types de bateau',
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
            validationRequired: 'Ce champ est requis.',
            validationEmail: 'Entrez une adresse e-mail valide.',
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
            validationRequired: 'Ce champ est requis.',
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
        programsEdit: {
            title: 'Modifier le programme',
            subtitle:
                'Mettez a jour les details, l’identifiant d’URL, la visibilite publique et l’archivage. Les changements se synchronisent via PowerSync ; les nouvelles images sont envoyees au serveur.',
            submit: 'Enregistrer',
            success: 'Programme mis a jour.',
            notFound:
                'Impossible de charger ce programme. Il a peut-etre ete supprime ou vous n’y avez pas acces.',
            backToList: 'Retour aux programmes',
            isArchived: 'Archive (absent de l’onglet Actifs)',
        },
        programsCreate: {
            title: 'Creer un programme',
            subtitle:
                'Les details de programme sont synchronises via PowerSync ; les images sont envoyees au serveur puis leurs metadonnees sont synchronisees.',
            formSection: 'Details du programme',
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
            unableLoadSync: 'Impossible de charger la synchronisation locale.',
            persistenceLimited:
                "Le stockage du navigateur (OPFS/SQLite) n'est pas disponible. L'espace de travail ne fonctionne qu'en ligne avec ce navigateur.",
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
        publicLayout: {
            catalog: 'Catalogue',
        },
        publicHome: {
            noPrograms: 'Aucun programme n’est publié pour le moment.',
            loadError: 'Impossible de charger les programmes. Reessayez plus tard.',
        },
        publicProgram: {
            notFound: 'Programme introuvable.',
            backToCatalog: 'Retour au catalogue',
        },
        boatsList: {
            title: 'Bateaux',
            description: 'Creez et modifiez des bateaux en local ; les changements se synchronisent via PowerSync.',
            addNew: 'Ajouter un bateau',
            name: 'Nom',
            capacity: 'Capacite',
            capacityHint: 'Capacite passagers optionnelle.',
            notes: 'Notes',
            boatType: 'Type de bateau',
            create: 'Creer le bateau',
            empty: 'Aucun bateau pour le moment. Ajoutez-en un ci-dessus.',
            created: 'Bateau enregistre.',
            deleted: 'Bateau supprime.',
            delete: 'Supprimer',
            deleteConfirmTitle: 'Supprimer le bateau ?',
            deleteConfirmMessage: 'Supprimer « {name} » ? Cette action est definitive.',
            nameRequired: 'Le nom est obligatoire.',
            errorGeneric: 'Une erreur est survenue. Veuillez reessayer.',
            programRoster: 'Programme (liste)',
            programRosterHint:
                'Choisissez le programme auquel rattacher cette liste. Les bateaux se synchronisent pour ce programme seulement.',
            noProgramsForBoats:
                "Creez d'abord un programme, puis selectionnez-le pour gerer ses bateaux.",
        },
        boatTypesList: {
            title: 'Types de bateau',
            description:
                'Definissez des categories reutilisables. Les images sont envoyees au serveur puis leurs metadonnees sont synchronisees.',
            addNew: 'Nouveau type',
            name: 'Nom',
            rename: 'Modifier le nom',
            create: 'Creer',
            images: 'Images',
            imagesUploaded: 'Images ajoutees.',
            empty: 'Aucun type pour le moment. Creez-en un ci-dessus.',
            created: 'Type enregistre.',
            deleted: 'Type supprime.',
            delete: 'Supprimer',
            deleteConfirmTitle: 'Supprimer le type ?',
            deleteConfirmMessage:
                'Supprimer « {name} » ? Les bateaux lies verront ce type efface.',
            errorGeneric: 'Une erreur est survenue. Veuillez reessayer.',
        },
        programsList: {
            title: 'Programmes',
            description:
                'Utilisez les onglets Actifs et Archives pour votre espace. Activez Publie sur le site public pour le catalogue ; modifiez les details et l’URL sur la page d’edition ; copiez le lien partageable.',
            empty: "Aucun programme pour l'instant. Utilisez le bouton ci-dessus pour en creer un.",
            emptyActive: "Aucun programme dans l’onglet Actifs.",
            emptyArchived: "Aucun programme archive.",
            addProgram: 'Nouveau programme',
            tabActive: 'Actifs',
            tabArchived: 'Archives',
            editProgram: 'Modifier le programme',
            isActive: 'Publie sur le site public',
            slug: 'Identifiant d’URL',
            slugHint: 'En minuscules, lettres, chiffres et tirets. La page publique est /programs/votre-identifiant. Les doublons seront ajustes.',
            slugRequired: 'L’identifiant d’URL est obligatoire. Utilisez une valeur en minuscules, unique.',
            copyUrl: 'Copier le lien public',
            copied: 'Lien copie',
            noDescription: 'Aucune description',
            noAddress: 'Aucune adresse',
        },
        locale: {
            english: 'Anglais',
            french: 'Francais',
        },
    },
};

function normalizeLocale(value: unknown): AppLocale {
    if (typeof value !== 'string' || value.length === 0) {
        return DEFAULT_LOCALE;
    }

    const baseLocale = value.toLowerCase().split('-')[0];

    if (baseLocale === 'en' || baseLocale === 'fr') {
        return baseLocale;
    }

    return DEFAULT_LOCALE;
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

export function setLocale(locale: unknown) {
    const nextLocale = normalizeLocale(locale);
    i18n.global.locale.value = nextLocale;

    if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    }
}

export function translate(key: string, values: Record<string, unknown> = {}) {
    return i18n.global.t(key, values);
}
