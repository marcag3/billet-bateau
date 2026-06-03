/**
 * Parses program booking_questions from PowerSync JSON text or array storage.
 */
export function parseProgramBookingQuestions(raw: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw
            .map((question) => (typeof question === 'string' ? question.trim() : ''))
            .filter((question) => question.length > 0);
    }

    if (typeof raw !== 'string' || raw.trim().length === 0) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((question) => (typeof question === 'string' ? question.trim() : ''))
            .filter((question) => question.length > 0);
    } catch {
        return [];
    }
}

/**
 * Normalizes repeater rows into a unique, trimmed question list for persistence.
 */
export function parseBookingQuestionsInput(raw: string[]): string[] {
    return Array.from(
        new Set(
            raw
                .map((line) => line.trim())
                .filter((line) => line.length > 0),
        ),
    );
}
