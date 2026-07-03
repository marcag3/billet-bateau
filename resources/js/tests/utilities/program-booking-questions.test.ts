import { describe, expect, it } from 'vitest';
import {
    customAnswersFromFieldMap,
    parseBookingTicketCustomFields,
    parseProgramBookingQuestions,
    validateBookingCustomAnswers,
} from '../../utilities/program-booking-questions';

describe('program-booking-questions', () => {
    it('parseProgramBookingQuestions handles JSON text', () => {
        expect(parseProgramBookingQuestions('["Dietary restrictions?"]')).toEqual([
            'Dietary restrictions?',
        ]);
    });

    it('parseBookingTicketCustomFields handles JSON text', () => {
        expect(
            parseBookingTicketCustomFields(
                JSON.stringify({ 'Dietary restrictions?': 'None' }),
            ),
        ).toEqual({ 'Dietary restrictions?': 'None' });
    });

    it('parseBookingTicketCustomFields handles object input', () => {
        expect(
            parseBookingTicketCustomFields({ 'Shoe size': '42' }),
        ).toEqual({ 'Shoe size': '42' });
    });

    it('parseBookingTicketCustomFields returns empty object for invalid input', () => {
        expect(parseBookingTicketCustomFields(null)).toEqual({});
        expect(parseBookingTicketCustomFields('not-json')).toEqual({});
        expect(parseBookingTicketCustomFields('[]')).toEqual({});
    });

    it('validateBookingCustomAnswers requires all configured answers', () => {
        const t = (key: string) => key;
        const result = validateBookingCustomAnswers({
            questions: ['Dietary restrictions?'],
            answers: [''],
            t,
        });

        expect(result.customFieldMap).toBeNull();
        expect(result.errors[0]).toBe('publicBooking.customAnswerRequired');
    });

    it('validateBookingCustomAnswers builds customFieldMap when complete', () => {
        const t = (key: string) => key;
        const result = validateBookingCustomAnswers({
            questions: ['Dietary restrictions?'],
            answers: ['None'],
            t,
        });

        expect(result.errors).toEqual({});
        expect(result.customFieldMap).toEqual({ 'Dietary restrictions?': 'None' });
    });

    it('customAnswersFromFieldMap preserves question order', () => {
        expect(
            customAnswersFromFieldMap(['A', 'B'], { B: 'two', A: 'one' }),
        ).toEqual(['one', 'two']);
    });
});
