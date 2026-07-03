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

/**
 * Parses booking_tickets.custom_fields from PowerSync JSON text or object storage.
 */
export function parseBookingTicketCustomFields(raw: unknown): Record<string, string> {
    let parsed: unknown = raw;

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
            return {};
        }

        try {
            parsed = JSON.parse(trimmed) as unknown;
        } catch {
            return {};
        }
    }

    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return {};
    }

    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
        const question = String(key).trim();
        if (question.length === 0) {
            continue;
        }

        result[question] = String(value ?? '').trim();
    }

    return result;
}

export type BookingCustomAnswersValidation = {
    errors: Record<number, string>;
    customFieldMap: Record<string, string> | null;
};

/**
 * Validates admin/public booking custom question answers against configured program questions.
 */
export function validateBookingCustomAnswers(input: {
    questions: string[];
    answers: string[];
    t: (key: string, params?: Record<string, string>) => string;
}): BookingCustomAnswersValidation {
    const { questions, answers, t } = input;
    const errors: Record<number, string> = {};
    const customFieldMap: Record<string, string> = {};

    questions.forEach((question, index) => {
        const answer = String(answers[index] ?? '').trim();
        if (answer.length === 0) {
            errors[index] = t('publicBooking.customAnswerRequired', { question });
        } else {
            customFieldMap[question] = answer;
        }
    });

    if (Object.keys(errors).length > 0) {
        return { errors, customFieldMap: null };
    }

    if (questions.length === 0) {
        return { errors, customFieldMap: {} };
    }

    return { errors, customFieldMap };
}

/**
 * Builds parallel answer array from a custom-field map and configured question order.
 */
export function customAnswersFromFieldMap(
    questions: string[],
    customFieldMap: Record<string, string>,
): string[] {
    return questions.map((question) => String(customFieldMap[question] ?? '').trim());
}
