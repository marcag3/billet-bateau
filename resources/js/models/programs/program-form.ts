import type { ProgramOutput } from '../../powersync/programs.collection';
import { normalizeAddressRowFields } from '../../utilities/program-helpers';
import { parseProgramBookingQuestions } from '../../utilities/program-booking-questions';
import type {
    ProgramCreateFormValues,
    ProgramEditFormValues,
} from './programs.validation';

export type ProgramFormSubmitPayload = {
    values: ProgramCreateFormValues | ProgramEditFormValues;
    bookingQuestions: string[];
};

export function programToFormValues(p: ProgramOutput): ProgramEditFormValues {
    return {
        name: String(p.name ?? '').trim(),
        description: typeof p.description === 'string' ? p.description : '',
        themeColor:
            typeof p.theme_color === 'string' && p.theme_color.length > 0
                ? String(p.theme_color).trim()
                : '#08758A',
        slug: String(p.slug ?? '')
            .trim()
            .toLowerCase(),
        startDate:
            typeof p.start_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.start_date)
                ? p.start_date
                : '',
        endDate:
            typeof p.end_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(p.end_date)
                ? p.end_date
                : '',
        bookingQuestionsText: parseProgramBookingQuestions(p.booking_questions).join('\n'),
        emailSignature: typeof p.email_signature === 'string' ? String(p.email_signature) : '',
        isActive: p.is_active ?? true,
        address: {
            line_1: typeof p.line_1 === 'string' ? String(p.line_1) : '',
            line_2: typeof p.line_2 === 'string' ? String(p.line_2) : '',
            city: typeof p.city === 'string' ? String(p.city) : '',
            postal_code:
                typeof p.postal_code === 'string' ? String(p.postal_code) : '',
            country: typeof p.country === 'string' ? String(p.country) : '',
        },
    } satisfies ProgramEditFormValues;
}

export type ProgramDraftPatch = {
    name: string;
    description: string | null;
    theme_color: string;
    slug: string;
    is_active: number;
    start_date: string;
    end_date: string;
    booking_questions: string;
    email_signature: string | null;
    line_1: string | null;
    line_2: string | null;
    city: string | null;
    postal_code: string | null;
    country: string | null;
};

export function toProgramDraftPatch(
    values: ProgramEditFormValues,
    bookingQuestions: string[],
): ProgramDraftPatch {
    const addressFields = normalizeAddressRowFields({ ...values.address });
    return {
        name: values.name,
        description: values.description.length > 0 ? values.description : null,
        theme_color: values.themeColor,
        slug: values.slug,
        is_active: values.isActive ? 1 : 0,
        start_date: values.startDate,
        end_date: values.endDate,
        booking_questions: JSON.stringify(bookingQuestions),
        email_signature: values.emailSignature.length > 0 ? values.emailSignature : null,
        line_1: addressFields.line_1,
        line_2: addressFields.line_2,
        city: addressFields.city,
        postal_code: addressFields.postal_code,
        country: addressFields.country,
    };
}
